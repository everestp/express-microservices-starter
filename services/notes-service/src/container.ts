import { createAccessTokenMiddleware, createServiceTokenMiddleware } from "@starter/service-auth";
import { createNotesRepository } from "./infrastructure/index.js";

export function createNotesContainer(environment = process.env) {
  const databaseUrl = environment.NOTES_DATABASE_URL;
  const serviceTokenSecret = environment.SERVICE_TOKEN_SECRET;
  const jwksUrl = environment.AUTH_JWKS_URL ?? "http://localhost:8081/.well-known/jwks.json";
  if (!databaseUrl || !serviceTokenSecret) {
    throw new Error("NOTES_DATABASE_URL and SERVICE_TOKEN_SECRET must be configured");
  }
  return {
    repository: createNotesRepository(databaseUrl),
    authenticate: createAccessTokenMiddleware(jwksUrl),
    requireGateway: createServiceTokenMiddleware(serviceTokenSecret, ["gateway"]),
  };
}
