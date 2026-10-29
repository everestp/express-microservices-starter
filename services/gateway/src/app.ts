import { createInMemoryRateLimit, createServiceApp, installErrorHandlers } from "@starter/http-kit";
import { DownstreamError } from "@starter/service-client";
import { createMetrics } from "@starter/telemetry";
import type { ErrorRequestHandler } from "express";
import type { GatewayContainer } from "./container.js";
import type { GatewayEnv } from "../config/env.js";
import { mapDownstreamError } from "../mappers/downstream-error.mapper.js";
import { createV1Router } from "../versions/v1.js";

export function createGatewayApp(config: GatewayEnv, container: GatewayContainer) {
  const app = createServiceApp("gateway");
  const metrics = createMetrics("gateway");

  app.use((request, response, next) => {
    const startedAt = process.hrtime.bigint();
    response.once("finish", () => {
      metrics.observeRequest(
        request.method,
        request.route?.path?.toString() ?? "unmatched",
        response.statusCode,
        Number(process.hrtime.bigint() - startedAt) / 1_000_000_000,
      );
    });
    next();
  });

  app.get("/api/v1/health", async (_request, response) => {
    const targets = {
      auth: config.AUTH_SERVICE_URL,
      notes: config.NOTES_SERVICE_URL,
      audit: config.AUDIT_SERVICE_URL,
    };
    const dependencies = await Promise.all(
      Object.entries(targets).map(async ([name, url]) => {
        try {
          const result = await fetch(`${url}/readyz`, {
            signal: AbortSignal.timeout(1500),
          });
          return [name, result.ok] as const;
        } catch {
          return [name, false] as const;
        }
      }),
    );
    const healthy = dependencies.every(([, status]) => status);
    response.status(healthy ? 200 : 503).json({
      status: healthy ? "ok" : "degraded",
      dependencies: Object.fromEntries(dependencies),
    });
  });

  app.get("/metrics", async (_request, response) => {
    response.setHeader("content-type", metrics.registry.contentType);
    response.end(await metrics.registry.metrics());
  });
  app.use(createInMemoryRateLimit({ limit: config.RATE_LIMIT_MAX, windowMs: 60_000 }));

  app.get("/.well-known/jwks.json", async (_request, response, next) => {
    try {
      const result = await fetch(`${config.AUTH_SERVICE_URL}/.well-known/jwks.json`, {
        signal: AbortSignal.timeout(2500),
      });
      response
        .status(result.status)
        .type("application/json")
        .send(await result.text());
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/v1", createV1Router(container));
  app.use(((error: unknown, _request, _response, next) => {
    next(error instanceof DownstreamError ? mapDownstreamError(error) : error);
  }) satisfies ErrorRequestHandler);
  installErrorHandlers(app);
  return app;
}
