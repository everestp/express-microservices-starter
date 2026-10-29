import { Router } from "express";
import type { createGatewayContainer } from "../container.js";
import { createAuthRouter } from "../routes/auth.router.js";
import { createNotesRouter } from "../routes/notes.router.js";
import { createAuditRouter } from "../routes/audit.router.js";

export function createV1Router(
  container: ReturnType<typeof createGatewayContainer>,
): Router {
  const router = Router();
  router.use("/auth", createAuthRouter(container.auth));
  router.use("/notes", createNotesRouter(container.notes));
  router.use("/audit", createAuditRouter(container.audit));
  return router;
}
