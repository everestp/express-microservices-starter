import { randomUUID } from "node:crypto";
import pg from "pg";

const { Client } = pg;
const connectionString = process.env.NOTES_DATABASE_URL;
if (!connectionString) throw new Error("NOTES_DATABASE_URL must be configured");
const client = new Client({ connectionString });
await client.connect();
try {
  const userId = process.env.SEED_USER_ID;
  if (!userId) {
    console.info("Set SEED_USER_ID to an existing auth user; seed skipped");
  } else {
    await client.query(
      `INSERT INTO notes (id, owner_user_id, title, content)
       VALUES ($1, $2, 'Welcome', 'A local development note')
       ON CONFLICT (id) DO NOTHING`,
      [randomUUID(), userId],
    );
  }
} finally {
  await client.end();
}
