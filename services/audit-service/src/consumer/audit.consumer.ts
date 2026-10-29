import type { EventBus, EventEnvelope } from "@starter/event-bus";
import type { Pool } from "pg";
import { toAuditFields } from "../application/audit.service.js";
import { createAuditRepository } from "../infrastructure/audit.repository.js";
import { createUserRegisteredHandler } from "./handlers/user-registered.handler.js";
import { createNoteCreatedHandler } from "./handlers/note-created.handler.js";
import { createNoteUpdatedHandler } from "./handlers/note-updated.handler.js";
import { createNoteDeletedHandler } from "./handlers/note-deleted.handler.js";

export function createAuditConsumer(pool: Pool, bus: EventBus) {
  const repository = createAuditRepository(pool);
  async function handle(event: EventEnvelope): Promise<void> {
    const fields = toAuditFields(event);
    if (!fields) throw new Error(`Unsupported audit event: ${event.type}`);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await repository.recordOnce(client, event, fields);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function start(): Promise<Array<() => Promise<void>>> {
    const handlers = [
      ["user.registered.v1", createUserRegisteredHandler(handle)],
      ["note.created.v1", createNoteCreatedHandler(handle)],
      ["note.updated.v1", createNoteUpdatedHandler(handle)],
      ["note.deleted.v1", createNoteDeletedHandler(handle)],
    ];
    return Promise.all(handlers.map(([subject, handler]) => bus.subscribe(subject, handler)));
  }

  return { handle, start };
}
