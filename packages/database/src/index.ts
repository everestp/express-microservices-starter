import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool, type PoolClient } from "pg";

const MIGRATION_LOCK_ID = 284731;

export interface DatabaseConfig {
  connectionString: string;
  max?: number;
}

export function createDatabasePool(config: DatabaseConfig): Pool {
  if (!config.connectionString) {
    throw new Error("A database connection string is required");
  }

  return new Pool({
    connectionString: config.connectionString,
    max: config.max ?? 10,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
  });
}

export async function withTransaction<T>(
  pool: Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface MigrationSections {
  up: string;
  down: string;
}

export function parseMigration(source: string): MigrationSections {
  let section: "up" | "down" | undefined;
  const sections: MigrationSections = { up: "", down: "" };

  for (const line of source.split(/\r?\n/)) {
    if (/^\s*--\s*migrate:up\s*$/i.test(line)) {
      section = "up";
    } else if (/^\s*--\s*migrate:down\s*$/i.test(line)) {
      section = "down";
    } else if (section) {
      sections[section] += `${line}\n`;
    }
  }

  if (!sections.up.trim() || !sections.down.trim()) {
    throw new Error(
      "Migration must contain non-empty migrate:up and migrate:down sections",
    );
  }
  return sections;
}

export async function runMigrations(
  pool: Pool,
  directory: string,
  direction: "up" | "down" = "up",
): Promise<string[]> {
  const client = await pool.connect();
  const completed: string[] = [];

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const names = (await readdir(directory))
      .filter((name) => /^\d+_[a-z0-9_-]+\.sql$/i.test(name))
      .sort();
    const appliedResult = await client.query<{ name: string }>(
      "SELECT name FROM schema_migrations ORDER BY name",
    );
    const applied = new Set(appliedResult.rows.map((row) => row.name));
    const pending =
      direction === "up"
        ? names.filter((name) => !applied.has(name))
        : names
            .filter((name) => applied.has(name))
            .reverse()
            .slice(0, 1);

    for (const name of pending) {
      const sections = parseMigration(
        await readFile(join(directory, name), "utf8"),
      );
      await client.query("BEGIN");
      try {
        await client.query(sections[direction]);
        if (direction === "up") {
          await client.query(
            "INSERT INTO schema_migrations (name) VALUES ($1)",
            [name],
          );
        } else {
          await client.query("DELETE FROM schema_migrations WHERE name = $1", [
            name,
          ]);
        }
        await client.query("COMMIT");
        completed.push(name);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    return completed;
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    } finally {
      client.release();
    }
  }
}
