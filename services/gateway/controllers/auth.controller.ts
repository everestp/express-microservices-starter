import type { RequestHandler } from "express";
import type { ReturnTypeOfAuthClient } from "../types.js";

export function createAuthController(client: ReturnTypeOfAuthClient) {
  const requestId = (response: Parameters<RequestHandler>[1]) =>
    String(response.locals.requestId);
  const forward: (method: "register" | "login" | "refresh") => RequestHandler =
    (method) => async (request, response) => {
      const result = await client[method](request.body, requestId(response));
      response.status(method === "register" ? 201 : 200).json(result);
    };
  return {
    register: forward("register"),
    login: forward("login"),
    refresh: forward("refresh"),
  };
}
