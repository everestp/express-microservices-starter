import { createServiceApp, listen } from "@starter/http-kit";

const app = createServiceApp("auth-service");
listen(app, Number(process.env.AUTH_SERVICE_PORT ?? 8081), "auth-service");