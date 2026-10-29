import type { RequestHandler } from "express";
import type { createAuditClient } from "../clients/audit.client.js";

type AuditClient = ReturnType<typeof createAuditClient>;

export function createAuditController(client: AuditClient) {
  return {
    list: (async (request, response) => {
      const query = new URLSearchParams();
      if (typeof request.query.cursor === "string")
        query.set("cursor", request.query.cursor);
      if (typeof request.query.limit === "string")
        query.set("limit", request.query.limit);
      const suffix = query.size ? `?${query}` : "";
      const authorization = request.header("authorization") ?? "";
      response.json(
        await client.listEvents(
          authorization,
          String(response.locals.requestId),
          suffix,
        ),
      );
    }) satisfies RequestHandler,
  };
}
