import { installErrorHandlers, listen } from "@starter/http-kit";
import { createAuditApp } from "./app.js";
import { createAuditContainer } from "./container.js";

const container = await createAuditContainer();
const app = createAuditApp(container.repository, container.jwksUrl, container.requireGateway);
installErrorHandlers(app);
const server = listen(app, Number(process.env.AUDIT_SERVICE_PORT ?? 8083), "audit-service");

const shutdown = () => {
  server.close(() => {
    void Promise.all(container.stopConsumers.map((stop) => stop()))
      .then(() => container.eventBus.close())
      .then(() => container.pool.end());
  });
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
