import { Router } from "express";

export function createJwksRouter(publicJwks: {
  keys: readonly Record<string, unknown>[];
}): Router {
  const router = Router();
  router.get("/", (_request, response) => {
    response.setHeader("cache-control", "public, max-age=300");
    response.json(publicJwks);
  });
  return router;
}
