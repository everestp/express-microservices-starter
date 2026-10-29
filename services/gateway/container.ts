import { createAuthClient } from "./clients/auth.client.js";
import { createAuditClient } from "./clients/audit.client.js";
import { createNotesClient } from "./clients/notes.client.js";
import type { GatewayEnv } from "./config/env.js";

export function createGatewayContainer(config: GatewayEnv) {
  return {
    auth: createAuthClient(config.AUTH_SERVICE_URL),
    notes: createNotesClient(config.NOTES_SERVICE_URL),
    audit: createAuditClient(config.AUDIT_SERVICE_URL),
  };
}
