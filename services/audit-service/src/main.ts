import { createServiceApp, listen } from "@starter/http-kit";

const app = createServiceApp("audit-service");
listen(app, Number(process.env.AUDIT_SERVICE_PORT ?? 8083), "audit-service");