import { randomUUID } from "node:crypto";

export type NoteEventType =
  | "note.created.v1"
  | "note.updated.v1"
  | "note.deleted.v1";

export function noteEvent(
  type: NoteEventType,
  data: Record<string, unknown>,
  occurredAt = new Date(),
) {
  return {
    eventId: randomUUID(),
    type,
    version: 1,
    occurredAt: occurredAt.toISOString(),
    data,
  } as const;
}
