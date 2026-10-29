import { Router } from "express";
import type { ReturnTypeOfNotesClient } from "../types.js";
import { createNotesController } from "../controllers/notes.controller.js";

export function createNotesRouter(client: ReturnTypeOfNotesClient): Router {
  const router = Router();
  const controller = createNotesController(client);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:noteId", controller.get);
  router.put("/:noteId", controller.update);
  router.delete("/:noteId", controller.remove);
  return router;
}
