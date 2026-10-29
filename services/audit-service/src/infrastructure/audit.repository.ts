import type { Pool, PoolClient } from "pg";
import type { AuditFields } from "../application/audit.service.js";
import type { EventEnvelope } from "@starter/event-bus";

export function createAuditRepository(pool: Pool) {
  return {
    pool,
    async recordOnce(
      client: PoolClient,
      event: EventEnvelope,
      fields: AuditFields,
    ): Promise<boolean> {
      const inserted = await client.query(
        `INSERT INTO processed_events (event_id) VALUES ($1)
         ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
        [event.eventId],
      );
      if (!inserted.rowCount) return false;
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
      return true;
    },
    async listForActor(actorId: string, limit: number) {
      const result = await pool.query(
        `SELECT id, event_id, actor_id, action, resource_type, resource_id, occurred_at
         FROM audit_events WHERE actor_id = $1
         ORDER BY occurred_at DESC, id DESC LIMIT $2`,
        [actorId, limit],
      );
      return result.rows;
    },
  };
}

export type AuditRepository = ReturnType<typeof createAuditRepository>;
