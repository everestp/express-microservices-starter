import { randomUUID } from "node:crypto";
import { createDatabasePool, withTransaction } from "@starter/database";
import type { NoteCreate, NoteUpdate } from "@starter/contracts";
import type { Pool, PoolClient } from "pg";

export interface NoteRecord {
  id: string;
  owner_user_id: string;
  title: string;
  content: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface NotePage {
  items: NoteRecord[];
  nextCursor: string | null;
}

export interface NoteCursor {
  createdAt: string;
  id: string;
}

export function createNotesRepository(databaseUrl: string) {
  const pool = createDatabasePool({ connectionString: databaseUrl });

  async function writeEvent(
    client: PoolClient,
    note: NoteRecord,
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const eventId = randomUUID();
    const occurredAt = new Date().toISOString();
    await client.query(
      `INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1, 'note', $2, $3, $4::jsonb)`,
      [
        eventId,
        note.id,
        eventType,
        JSON.stringify({
          eventId,
          type: eventType,
          version: 1,
          occurredAt,
          data,
        }),
      ],
    );
  }

  async function list(
    ownerUserId: string,
    limit: number,
    cursor: NoteCursor | null,
  ): Promise<NotePage> {
    const result = await pool.query<NoteRecord>(
      `SELECT id, owner_user_id, title, content, version, created_at, updated_at
       FROM notes
       WHERE owner_user_id = $1
         AND ($2::timestamptz IS NULL OR (created_at, id) < ($2::timestamptz, $3::uuid))
       ORDER BY created_at DESC, id DESC
       LIMIT $4`,
      [ownerUserId, cursor?.createdAt ?? null, cursor?.id ?? null, limit + 1],
    );
    const hasMore = result.rows.length > limit;
    const items = result.rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        hasMore && last
          ? Buffer.from(
              JSON.stringify({
                createdAt: last.created_at.toISOString(),
                id: last.id,
              }),
            ).toString("base64url")
          : null,
    };
  }

  async function get(
    ownerUserId: string,
    id: string,
  ): Promise<NoteRecord | null> {
    const result = await pool.query<NoteRecord>(
      `SELECT id, owner_user_id, title, content, version, created_at, updated_at
       FROM notes WHERE id = $1 AND owner_user_id = $2`,
      [id, ownerUserId],
    );
    return result.rows[0] ?? null;
  }

  async function create(
    ownerUserId: string,
    input: NoteCreate,
  ): Promise<NoteRecord> {
    return withTransaction(pool, async (client) => {
      const result = await client.query<NoteRecord>(
        `INSERT INTO notes (owner_user_id, title, content)
         VALUES ($1, $2, $3)
         RETURNING id, owner_user_id, title, content, version, created_at, updated_at`,
        [ownerUserId, input.title, input.content],
      );
      const note = result.rows[0]!;
      await writeEvent(client, note, "note.created.v1", {
        noteId: note.id,
        ownerUserId,
        title: note.title,
      });
      return note;
    });
  }

  async function update(
    ownerUserId: string,
    id: string,
    input: NoteUpdate,
  ): Promise<
    { kind: "updated"; note: NoteRecord } | { kind: "missing" | "conflict" }
  > {
    return withTransaction(pool, async (client) => {
      const result = await client.query<NoteRecord>(
        `UPDATE notes SET title = $4, content = $5, version = version + 1, updated_at = now()
         WHERE id = $1 AND owner_user_id = $2 AND version = $3
         RETURNING id, owner_user_id, title, content, version, created_at, updated_at`,
        [id, ownerUserId, input.version, input.title, input.content],
      );
      const note = result.rows[0];
      if (!note) {
        const existing = await client.query(
          "SELECT 1 FROM notes WHERE id = $1 AND owner_user_id = $2",
          [id, ownerUserId],
        );
        return { kind: existing.rowCount ? "conflict" : "missing" };
      }
      await writeEvent(client, note, "note.updated.v1", {
        noteId: note.id,
        ownerUserId,
        title: note.title,
        version: note.version,
      });
      return { kind: "updated", note };
    });
  }

  async function remove(
    ownerUserId: string,
    id: string,
    version: number,
  ): Promise<"deleted" | "missing" | "conflict"> {
    return withTransaction(pool, async (client) => {
      const result = await client.query<NoteRecord>(
        `DELETE FROM notes WHERE id = $1 AND owner_user_id = $2 AND version = $3
         RETURNING id, owner_user_id, title, content, version, created_at, updated_at`,
        [id, ownerUserId, version],
      );
      const note = result.rows[0];
      if (!note) {
        const existing = await client.query(
          "SELECT 1 FROM notes WHERE id = $1 AND owner_user_id = $2",
          [id, ownerUserId],
        );
        return existing.rowCount ? "conflict" : "missing";
      }
      await writeEvent(client, note, "note.deleted.v1", {
        noteId: note.id,
        ownerUserId,
        version: note.version,
      });
      return "deleted";
    });
  }

  return { pool, list, get, create, update, remove };
}

export type NotesRepository = ReturnType<typeof createNotesRepository>;

export function encodeCursor(cursor: NoteCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(value: string): NoteCursor | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("createdAt" in parsed) ||
      !("id" in parsed) ||
      typeof parsed.createdAt !== "string" ||
      Number.isNaN(Date.parse(parsed.createdAt)) ||
      typeof parsed.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        parsed.id,
      )
    ) {
      return null;
    }
    return {
      createdAt: new Date(parsed.createdAt).toISOString(),
      id: parsed.id,
    };
  } catch {
    return null;
  }
}
