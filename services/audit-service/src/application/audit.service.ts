import type { EventEnvelope } from "@starter/event-bus";

export interface AuditFields {
  actorId: string;
  resourceType: string;
  resourceId: string;
}

export function toAuditFields(event: EventEnvelope): AuditFields | null {
  const data = event.data;
  if (event.type === "user.registered.v1" && typeof data.userId === "string") {
    return {
      actorId: data.userId,
      resourceType: "user",
      resourceId: data.userId,
    };
  }
  if (
    event.type.startsWith("note.") &&
    typeof data.ownerUserId === "string" &&
    typeof data.noteId === "string"
  ) {
    return {
      actorId: data.ownerUserId,
      resourceType: "note",
      resourceId: data.noteId,
    };
  }
  return null;
}
