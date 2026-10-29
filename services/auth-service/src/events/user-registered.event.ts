import { randomUUID } from "node:crypto";

export function userRegisteredEvent(
  user: { id: string; email: string },
  occurredAt = new Date(),
) {
  return {
    eventId: randomUUID(),
    type: "user.registered.v1",
    version: 1,
    occurredAt: occurredAt.toISOString(),
    data: { userId: user.id, email: user.email },
  } as const;
}
