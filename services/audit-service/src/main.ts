import { createDatabasePool } from "@starter/database";
import { connectJetStreamEventBus } from "@starter/event-bus";
import { createServiceApp, installErrorHandlers, listen } from "@starter/http-kit";
import { createAuditConsumer } from "./consumer/audit.consumer.js";

const app = createServiceApp("audit-service");
const databaseUrl = process.env.AUDIT_DATABASE_URL;
const natsUrl = process.env.NATS_URL;
if (!databaseUrl || !natsUrl) {
  throw new Error("AUDIT_DATABASE_URL and NATS_URL must be configured");
}
const pool = createDatabasePool({ connectionString: databaseUrl });
const eventBus = await connectJetStreamEventBus(natsUrl, {
  durablePrefix: "audit-service",
});
const auditConsumer = createAuditConsumer(pool, eventBus);
const stopConsumers = await auditConsumer.start();

app.get("/readyz", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({
      status: "ok",
      service: "audit-service",
      dependencies: { database: "ok" },
    });
  } catch {
    response.status(503).json({
      status: "unavailable",
      dependencies: { database: "unavailable" },
    });
  }
});

installErrorHandlers(app);
const server = listen(app, Number(process.env.AUDIT_SERVICE_PORT ?? 8083), "audit-service");
const shutdown = () => {
  server.close(() => {
    void Promise.all(stopConsumers.map((stop) => stop()))
      .then(() => eventBus.close())
      .then(() => pool.end());
  });
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
