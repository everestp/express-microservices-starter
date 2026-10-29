import { auditEventListSchema } from "@starter/contracts";
import { createServiceClient } from "@starter/service-client";

export function createAuditClient(baseUrl: string) {
  const client = createServiceClient({ baseUrl });
  return {
    listEvents: (token: string, requestId: string, query = "") =>
      client.request(
        `/internal/v1/audit/events${query}`,
        {
          headers: { authorization: token, "x-request-id": requestId },
        },
        auditEventListSchema,
      ),
  };
}
