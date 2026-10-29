import { createServiceApp } from "@starter/http-kit";
import type { RequestHandler } from "express";
import type { AuditRepository } from "./infrastructure/audit.repository.js";
import { createAuditRouter } from "./http/audit.router.js";

export function createAuditApp(
  repository: AuditRepository,
  jwksUrl: string,
  requireGateway: RequestHandler,
) {
  const app = createServiceApp("audit-service");
  app.get("/readyz", async (_request, response) => {
    try {
      await repository.pool.query("SELECT 1");
      response.json({
        status: "ok",
        service: "audit-service",
        dependencies: { database: "ok" },
      });
    } catch {
      response.status(503).json({
        status: "unavailable",
        dependencies: { database: "unavailable" },
      });
    }
  });
  app.use("/internal/v1/audit", requireGateway, createAuditRouter(repository, jwksUrl));
  return app;
}
