import { createDatabasePool } from "@starter/database";
import { connectJetStreamEventBus } from "@starter/event-bus";
import { createServiceTokenMiddleware } from "@starter/service-auth";
import { createAuditConsumer } from "./consumer/audit.consumer.js";
import { createAuditRepository } from "./infrastructure/audit.repository.js";

export async function createAuditContainer(environment = process.env) {
  const databaseUrl = environment.AUDIT_DATABASE_URL;
  const natsUrl = environment.NATS_URL;
  const serviceTokenSecret = environment.SERVICE_TOKEN_SECRET;
  const jwksUrl = environment.AUTH_JWKS_URL ?? "http://localhost:8081/.well-known/jwks.json";
  if (!databaseUrl || !natsUrl || !serviceTokenSecret) {
    throw new Error("AUDIT_DATABASE_URL, NATS_URL, and SERVICE_TOKEN_SECRET must be configured");
  }

  const pool = createDatabasePool({ connectionString: databaseUrl });
  try {
    const eventBus = await connectJetStreamEventBus(natsUrl, {
      durablePrefix: "audit-service",
    });
    const repository = createAuditRepository(pool);
    const consumer = createAuditConsumer(pool, eventBus);
    const stopConsumers = await consumer.start();
    const requireGateway = createServiceTokenMiddleware(serviceTokenSecret, ["gateway"]);
    return { pool, eventBus, repository, stopConsumers, jwksUrl, requireGateway };
  } catch (error) {
    await pool.end();
    throw error;
  }
}
