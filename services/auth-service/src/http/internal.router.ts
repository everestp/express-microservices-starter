import { Router } from "express";

export interface AuthHttpActions {
  register(body: unknown): Promise<unknown>;
  login(body: unknown): Promise<unknown>;
  refresh(body: unknown): Promise<unknown>;
}

export function createInternalAuthRouter(actions: AuthHttpActions): Router {
  const router = Router();
  router.post("/register", async (request, response) => {
    response.status(201).json(await actions.register(request.body));
  });
  router.post("/login", async (request, response) => {
    response.json(await actions.login(request.body));
  });
  router.post("/refresh", async (request, response) => {
    response.json(await actions.refresh(request.body));
  });
  return router;
}
