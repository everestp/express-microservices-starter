import type { EventBus, EventEnvelope } from "@starter/event-bus";
import type { Pool } from "pg";

interface OutboxRow {
  id: string;
  event_type: string;
  payload: EventEnvelope;
}

export interface OutboxRelayOptions {
  batchSize?: number;
  pollIntervalMs?: number;
  onError?: (error: unknown, row: OutboxRow) => void;
}

export function createOutboxRelay(
  pool: Pool,
  bus: EventBus,
  options: OutboxRelayOptions = {},
) {
  const batchSize = options.batchSize ?? 100;
  let running = false;
  let stopped = false;

  async function claimBatch(): Promise<OutboxRow[]> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<OutboxRow>(
        `SELECT id, event_type, payload FROM outbox
         WHERE published_at IS NULL
         ORDER BY occurred_at, id
         FOR UPDATE SKIP LOCKED LIMIT $1`,
        [batchSize],
      );
      await client.query("COMMIT");
      return result.rows;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function publishRow(row: OutboxRow): Promise<void> {
    try {
      await bus.publish(row.event_type, row.payload);
      await pool.query("UPDATE outbox SET published_at = now() WHERE id = $1", [
        row.id,
      ]);
    } catch (error) {
      options.onError?.(error, row);
      await pool.query(
        "UPDATE outbox SET attempts = attempts + 1, last_error = $2 WHERE id = $1",
        [
          row.id,
          error instanceof Error
            ? error.message.slice(0, 1000)
            : "unknown error",
        ],
      );
    }
  }

  async function tick(): Promise<void> {
    if (running || stopped) return;
    running = true;
    try {
      const rows = await claimBatch();
      for (const row of rows) await publishRow(row);
    } finally {
      running = false;
    }
  }

  async function start(): Promise<void> {
    stopped = false;
    while (!stopped) {
      await tick();
      await new Promise((resolve) =>
        setTimeout(resolve, options.pollIntervalMs ?? 1000),
      );
    }
  }

  function stop(): void {
    stopped = true;
  }

  return { start, stop, tick };
}
