import { Router } from "express";

export function createV2ExampleRouter(): Router {
  const router = Router();
  router.get("/example", (_request, response) => {
    response.json({ version: "v2", status: "example" });
  });
  return router;
}
