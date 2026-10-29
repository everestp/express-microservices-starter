import { z } from "zod";

export const gatewayEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GATEWAY_PORT: z.coerce.number().int().positive().default(8080),
  AUTH_SERVICE_URL: z.string().url().default("http://localhost:8081"),
  NOTES_SERVICE_URL: z.string().url().default("http://localhost:8082"),
  AUDIT_SERVICE_URL: z.string().url().default("http://localhost:8083"),
  SERVICE_TOKEN_SECRET: z.string().min(32),
  TRUST_PROXY: z.string().optional(),
  CORS_ALLOWED_ORIGINS: z.string().default(""),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

export type GatewayEnv = z.infer<typeof gatewayEnvSchema>;
