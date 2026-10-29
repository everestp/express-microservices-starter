import { Router } from "express";
import { z } from "zod";
import { HttpError } from "@starter/http-kit";
import { createAccessTokenMiddleware } from "@starter/service-auth";
import type { AuditRepository } from "../infrastructure/audit.repository.js";

export function createAuditRouter(repository: AuditRepository, jwksUrl: string): Router {
  const router = Router();
  router.use(createAccessTokenMiddleware(jwksUrl));
  router.get("/events", async (request, response) => {
    const parsedLimit = z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .safeParse(request.query.limit);
    if (!parsedLimit.success) throw new HttpError(400, "limit must be an integer from 1 to 100");
    const events = await repository.listForActor(response.locals.userId, parsedLimit.data);
    response.json({
      items: events.map((event) => ({
        id: event.id,
        eventId: event.event_id,
        actorId: event.actor_id,
        action: event.action,
        resourceType: event.resource_type,
        resourceId: event.resource_id,
        occurredAt: event.occurred_at.toISOString(),
      })),
      nextCursor: null,
    });
  });
  return router;
}
