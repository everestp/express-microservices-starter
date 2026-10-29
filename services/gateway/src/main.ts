import { loadConfig } from "@starter/config-kit";
import {
  createServiceApp,
  installErrorHandlers,
  listen,
} from "@starter/http-kit";
import { DownstreamError } from "@starter/service-client";
import type { ErrorRequestHandler } from "express";
import { createGatewayContainer } from "../container.js";
import { gatewayEnvSchema } from "../config/env.js";
import { mapDownstreamError } from "../mappers/downstream-error.mapper.js";
import { createV1Router } from "../versions/v1.js";

const config = loadConfig(gatewayEnvSchema);
const container = createGatewayContainer(config);
const app = createServiceApp("gateway");

app.get("/api/v1/health", async (_request, response) => {
  const dependencies = await Promise.all(
    [
      ["auth", config.AUTH_SERVICE_URL],
      ["notes", config.NOTES_SERVICE_URL],
      ["audit", config.AUDIT_SERVICE_URL],
    ].map(async ([name, url]) => {
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
  const status = dependencies.every(([, healthy]) => healthy);
  response.status(status ? 200 : 503).json({
    status: status ? "ok" : "degraded",
    dependencies: Object.fromEntries(dependencies),
  });
});

app.get("/.well-known/jwks.json", async (_request, response, next) => {
  try {
    const result = await fetch(
      `${config.AUTH_SERVICE_URL}/.well-known/jwks.json`,
      {
        signal: AbortSignal.timeout(2500),
      },
    );
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
listen(app, config.GATEWAY_PORT, "gateway");
