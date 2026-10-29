import type { RequestHandler } from "express";
import type { NotesRepository } from "./infrastructure/index.js";
import { createServiceApp } from "@starter/http-kit";

export function createNotesApp(
  repository: NotesRepository,
  authenticate: RequestHandler,
  requireGateway: RequestHandler,
) {
  const app = createServiceApp("notes-service");
  app.get("/readyz", async (_request, response) => {
    try {
      await repository.pool.query("SELECT 1");
      response.json({
        status: "ok",
        service: "notes-service",
        dependencies: { database: "ok" },
      });
    } catch {
      response.status(503).json({
        status: "unavailable",
        dependencies: { database: "unavailable" },
      });
    }
  });
  app.use("/internal/v1/notes", requireGateway, authenticate);
  return app;
}
