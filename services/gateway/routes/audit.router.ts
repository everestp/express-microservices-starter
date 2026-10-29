import { Router } from "express";
import type { createAuditClient } from "../clients/audit.client.js";
import { createAuditController } from "../controllers/audit.controller.js";

export function createAuditRouter(
  client: ReturnType<typeof createAuditClient>,
): Router {
  const router = Router();
  router.get("/events", createAuditController(client).list);
  return router;
}
