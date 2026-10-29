import type { RequestHandler } from "express";
import type { Pool } from "pg";
import { createServiceApp } from "@starter/http-kit";

export function createAuthApp(
  pool: Pool,
  publicJwk: Record<string, unknown>,
  requireGateway: RequestHandler,
) {
  const app = createServiceApp("auth-service");
  app.get("/.well-known/jwks.json", (_request, response) => {
    response.setHeader("cache-control", "public, max-age=300");
    response.json({ keys: [publicJwk] });
  });
  app.get("/readyz", async (_request, response) => {
    try {
      await pool.query("SELECT 1");
      response.json({
        status: "ok",
        service: "auth-service",
        dependencies: { database: "ok" },
      });
    } catch {
      response.status(503).json({
        status: "unavailable",
        dependencies: { database: "unavailable" },
      });
    }
  });
  app.use("/internal/v1/auth", requireGateway);
  return app;
}
