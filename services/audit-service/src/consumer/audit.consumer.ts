import type { EventBus, EventEnvelope } from "@starter/event-bus";
import type { Pool } from "pg";

interface NoteEventData {
  noteId: string;
  ownerUserId: string;
}

interface UserRegisteredData {
  userId: string;
}

function auditFields(event: EventEnvelope): {
  actorId: string;
  resourceType: string;
  resourceId: string;
} | null {
  const data = event.data as unknown as Partial<
    NoteEventData & UserRegisteredData
  >;
  if (event.type === "user.registered.v1" && data.userId) {
    return {
      actorId: data.userId,
      resourceType: "user",
      resourceId: data.userId,
    };
  }
  if (event.type.startsWith("note.") && data.ownerUserId && data.noteId) {
    return {
      actorId: data.ownerUserId,
      resourceType: "note",
      resourceId: data.noteId,
    };
  }
  return null;
}

export function createAuditConsumer(pool: Pool, bus: EventBus) {
  async function handle(event: EventEnvelope): Promise<void> {
    const fields = auditFields(event);
    if (!fields) throw new Error(`Unsupported audit event: ${event.type}`);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `INSERT INTO processed_events (event_id) VALUES ($1)
         ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
        [event.eventId],
      );
      if (inserted.rowCount) {
        await client.query(
          `INSERT INTO audit_events
             (event_id, actor_id, action, resource_type, resource_id, payload, occurred_at)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
          [
            event.eventId,
            fields.actorId,
            event.type,
            fields.resourceType,
            fields.resourceId,
            JSON.stringify(event.data),
            event.occurredAt,
          ],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function start(): Promise<Array<() => Promise<void>>> {
    const subjects = [
      "user.registered.v1",
      "note.created.v1",
      "note.updated.v1",
      "note.deleted.v1",
    ];
    return Promise.all(
      subjects.map((subject) => bus.subscribe(subject, handle)),
    );
  }

  return { handle, start };
}
