import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import argon2 from "argon2";
import { createDatabasePool } from "@starter/database";
import { createServiceTokenMiddleware } from "@starter/service-auth";
import { loadTokenService } from "./token.service.js";

export async function createAuthContainer(environment = process.env) {
  const databaseUrl = environment.AUTH_DATABASE_URL;
  const privateKeyFile = environment.JWT_PRIVATE_KEY_FILE;
  const publicKeyFile = environment.JWT_PUBLIC_KEY_FILE;
  const serviceTokenSecret = environment.SERVICE_TOKEN_SECRET;
  const keyId = environment.JWT_KEY_ID ?? "dev-1";
  if (!databaseUrl || !privateKeyFile || !publicKeyFile || !serviceTokenSecret) {
    throw new Error(
      "AUTH_DATABASE_URL, JWT_PRIVATE_KEY_FILE, JWT_PUBLIC_KEY_FILE, and SERVICE_TOKEN_SECRET must be configured",
    );
  }

  const pool = createDatabasePool({ connectionString: databaseUrl });
  try {
    const tokenService = await loadTokenService(
      resolve(privateKeyFile),
      resolve(publicKeyFile),
      keyId,
    );
    const dummyPasswordHash = await argon2.hash(randomBytes(32).toString("base64url"), {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
    const requireGateway = createServiceTokenMiddleware(serviceTokenSecret, ["gateway"]);
    return { pool, tokenService, dummyPasswordHash, requireGateway };
  } catch (error) {
    await pool.end();
    throw error;
  }
}
