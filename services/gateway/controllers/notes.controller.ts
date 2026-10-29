import type { RequestHandler } from "express";
import type { ReturnTypeOfNotesClient } from "../types.js";

export function createNotesController(client: ReturnTypeOfNotesClient) {
  function token(request: Parameters<RequestHandler>[0]): string {
    return request.header("authorization") ?? "";
  }
  function requestId(response: Parameters<RequestHandler>[1]): string {
    return String(response.locals.requestId);
  }
  return {
    list: (async (request, response) => {
      const query = new URLSearchParams();
      if (typeof request.query.limit === "string")
        query.set("limit", request.query.limit);
      if (typeof request.query.cursor === "string")
        query.set("cursor", request.query.cursor);
      const suffix = query.size ? `?${query}` : "";
      response.json(
        await client.list(token(request), requestId(response), suffix),
      );
    }) satisfies RequestHandler,
    get: (async (request, response) => {
      response.json(
        await client.get(
          request.params.noteId,
          token(request),
          requestId(response),
        ),
      );
    }) satisfies RequestHandler,
    create: (async (request, response) => {
      response
        .status(201)
        .json(
          await client.create(
            request.body,
            token(request),
            requestId(response),
          ),
        );
    }) satisfies RequestHandler,
    update: (async (request, response) => {
      response.json(
        await client.update(
          request.params.noteId,
          request.body,
          token(request),
          requestId(response),
        ),
      );
    }) satisfies RequestHandler,
    remove: (async (request, response) => {
      await client.remove(
        request.params.noteId,
        request.body,
        token(request),
        requestId(response),
      );
      response.status(204).end();
    }) satisfies RequestHandler,
  };
}
