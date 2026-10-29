import { createAuthClient } from "./clients/auth.client.js";
import { createAuditClient } from "./clients/audit.client.js";
import { createNotesClient } from "./clients/notes.client.js";
import type { GatewayEnv } from "./config/env.js";
import { createServiceTokenSigner } from "@starter/service-auth";

export function createGatewayContainer(config: GatewayEnv) {
  const serviceToken = createServiceTokenSigner(config.SERVICE_TOKEN_SECRET, "gateway");
  return {
    auth: createAuthClient(config.AUTH_SERVICE_URL, serviceToken),
    notes: createNotesClient(config.NOTES_SERVICE_URL, serviceToken),
    audit: createAuditClient(config.AUDIT_SERVICE_URL, serviceToken),
  };
}

export type GatewayContainer = ReturnType<typeof createGatewayContainer>;
