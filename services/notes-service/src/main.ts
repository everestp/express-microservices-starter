import { createServiceApp, listen } from "@starter/http-kit";

const app = createServiceApp("notes-service");
listen(app, Number(process.env.NOTES_SERVICE_PORT ?? 8082), "notes-service");