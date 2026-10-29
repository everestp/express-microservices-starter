import { resolve } from "node:path";
import { createDatabasePool, runMigrations } from "./index.js";

const [
  migrationDirectory = "migrations",
  directionArg = "up",
  databaseEnv = "DATABASE_URL",
] = process.argv.slice(2);
if (directionArg !== "up" && directionArg !== "down") {
  throw new Error("Migration direction must be 'up' or 'down'");
}

const databaseUrl = process.env[databaseEnv];
if (!databaseUrl) {
  throw new Error(`${databaseEnv} must be set to run migrations`);
}

const pool = createDatabasePool({ connectionString: databaseUrl });
try {
  const completed = await runMigrations(
    pool,
    resolve(migrationDirectory),
    directionArg,
  );
  console.info(
    completed.length
      ? `Applied: ${completed.join(", ")}`
      : "No migrations to apply",
  );
} finally {
  await pool.end();
}
