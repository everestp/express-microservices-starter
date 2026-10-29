import {
  loginRequestSchema,
  refreshRequestSchema,
  registerRequestSchema,
  registerResponseSchema,
  tokenPairSchema,
} from "@starter/contracts";
import { createServiceClient } from "@starter/service-client";

export function createAuthClient(baseUrl: string) {
  const client = createServiceClient({ baseUrl, retries: 0 });
  return {
    register: (body: unknown, requestId: string) =>
      client.request(
        "/internal/v1/auth/register",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-request-id": requestId,
          },
          body: JSON.stringify(registerRequestSchema.parse(body)),
        },
        registerResponseSchema,
      ),
    login: (body: unknown, requestId: string) =>
      client.request(
        "/internal/v1/auth/login",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-request-id": requestId,
          },
          body: JSON.stringify(loginRequestSchema.parse(body)),
        },
        tokenPairSchema,
      ),
    refresh: (body: unknown, requestId: string) =>
      client.request(
        "/internal/v1/auth/refresh",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-request-id": requestId,
          },
          body: JSON.stringify(refreshRequestSchema.parse(body)),
        },
        tokenPairSchema,
      ),
  };
}
