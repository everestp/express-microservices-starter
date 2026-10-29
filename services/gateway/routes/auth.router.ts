import { Router } from "express";
import type { ReturnTypeOfAuthClient } from "../types.js";
import { createAuthController } from "../controllers/auth.controller.js";

export function createAuthRouter(client: ReturnTypeOfAuthClient): Router {
  const router = Router();
  const controller = createAuthController(client);
  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/refresh", controller.refresh);
  return router;
}
