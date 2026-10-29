import { createHash, randomBytes, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import argon2 from "argon2";
import {
  loginRequestSchema,
  refreshRequestSchema,
  registerRequestSchema,
} from "@starter/contracts";
import { createDatabasePool, withTransaction } from "@starter/database";
import {
  createServiceApp,
  HttpError,
  installErrorHandlers,
  listen,
} from "@starter/http-kit";
import type { PoolClient } from "pg";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  loadTokenService,
} from "./token.service.js";

const serviceName = "auth-service";
const databaseUrl = process.env.AUTH_DATABASE_URL;
const privateKeyFile = process.env.JWT_PRIVATE_KEY_FILE;
const publicKeyFile = process.env.JWT_PUBLIC_KEY_FILE;
const keyId = process.env.JWT_KEY_ID ?? "dev-1";
if (!databaseUrl || !privateKeyFile || !publicKeyFile) {
  throw new Error(
    "AUTH_DATABASE_URL, JWT_PRIVATE_KEY_FILE, and JWT_PUBLIC_KEY_FILE must be configured",
  );
}

const pool = createDatabasePool({ connectionString: databaseUrl });
const tokenService = await loadTokenService(
  resolve(privateKeyFile),
  resolve(publicKeyFile),
  keyId,
);
const dummyPasswordHash = await argon2.hash(
  randomBytes(32).toString("base64url"),
  {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  },
);
const app = createServiceApp(serviceName);

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

async function insertRefreshToken(
  client: PoolClient,
  userId: string,
  familyId: string,
  token: string,
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
		 VALUES ($1, $2, $3, now() + ($4 * interval '1 second'))
		 RETURNING id`,
    [userId, familyId, hashRefreshToken(token), REFRESH_TOKEN_TTL_SECONDS],
  );
  return result.rows[0]!.id;
}

async function tokenPair(userId: string, refreshToken: string) {
  return {
    accessToken: await tokenService.signAccessToken(userId),
    tokenType: "Bearer" as const,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken,
    refreshExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
  };
}

app.get("/.well-known/jwks.json", (_request, response) => {
  response.setHeader("cache-control", "public, max-age=300");
  response.json({ keys: [tokenService.publicJwk] });
});

app.get("/readyz", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({
      status: "ok",
      service: serviceName,
      dependencies: { database: "ok" },
    });
  } catch {
    response
      .status(503)
      .json({
        status: "unavailable",
        dependencies: { database: "unavailable" },
      });
  }
});

app.post("/internal/v1/auth/register", async (request, response) => {
  const parsed = registerRequestSchema.safeParse(request.body);
  if (!parsed.success)
    throw new HttpError(400, "Registration details are invalid");
  const { email, password } = parsed.data;
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
  const eventId = randomUUID();
  const occurredAt = new Date().toISOString();

  try {
    const user = await withTransaction(pool, async (client) => {
      const result = await client.query<{
        id: string;
        email: string;
        created_at: Date;
      }>(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2)
				 RETURNING id, email, created_at`,
        [email, passwordHash],
      );
      const created = result.rows[0]!;
      await client.query(
        `INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload)
				 VALUES ($1, 'user', $2, 'user.registered.v1', $3::jsonb)`,
        [
          eventId,
          created.id,
          JSON.stringify({
            eventId,
            type: "user.registered.v1",
            version: 1,
            occurredAt,
            data: { userId: created.id, email: created.email },
          }),
        ],
      );
      return created;
    });
    response.status(201).json({
      id: user.id,
      email: user.email,
      createdAt: user.created_at.toISOString(),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new HttpError(409, "An account with that email already exists");
    }
    throw error;
  }
});

app.post("/internal/v1/auth/login", async (request, response) => {
  const parsed = loginRequestSchema.safeParse(request.body);
  if (!parsed.success) throw new HttpError(400, "Login details are invalid");
  const result = await pool.query<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [parsed.data.email],
  );
  const user = result.rows[0];
  const verified = await argon2.verify(
    user?.password_hash ?? dummyPasswordHash,
    parsed.data.password,
  );
  if (!user || !verified)
    throw new HttpError(401, "Email or password is incorrect");

  const refreshToken = newRefreshToken();
  await withTransaction(pool, async (client) => {
    await insertRefreshToken(client, user.id, randomUUID(), refreshToken);
  });
  response.json(await tokenPair(user.id, refreshToken));
});

app.post("/internal/v1/auth/refresh", async (request, response) => {
  const parsed = refreshRequestSchema.safeParse(request.body);
  if (!parsed.success) throw new HttpError(400, "Refresh token is invalid");
  const presentedToken = parsed.data.refreshToken;
  const replacementToken = newRefreshToken();
  const outcome = await withTransaction(pool, async (client) => {
    const result = await client.query<{
      id: string;
      user_id: string;
      family_id: string;
      revoked_at: Date | null;
      expired: boolean;
    }>(
      `SELECT id, user_id, family_id, revoked_at, expires_at <= now() AS expired
			 FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE`,
      [hashRefreshToken(presentedToken)],
    );
    const current = result.rows[0];
    if (!current) return { kind: "invalid" as const };
    if (current.revoked_at) {
      await client.query(
        "UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, now()) WHERE family_id = $1",
        [current.family_id],
      );
      return { kind: "reuse" as const };
    }
    if (current.expired) {
      await client.query(
        "UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1",
        [current.id],
      );
      return { kind: "invalid" as const };
    }

    const replacementId = await insertRefreshToken(
      client,
      current.user_id,
      current.family_id,
      replacementToken,
    );
    await client.query(
      "UPDATE refresh_tokens SET revoked_at = now(), replaced_by = $2 WHERE id = $1",
      [current.id, replacementId],
    );
    return { kind: "ok" as const, userId: current.user_id };
  });

  if (outcome.kind !== "ok")
    throw new HttpError(401, "Refresh token is invalid or has been reused");
  response.json(await tokenPair(outcome.userId, replacementToken));
});

installErrorHandlers(app);
const server = listen(
  app,
  Number(process.env.AUTH_SERVICE_PORT ?? 8081),
  serviceName,
);
const shutdown = () => server.close(() => void pool.end());
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
