import { errors, createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import type { RequestHandler } from "express";
import { HttpError } from "@starter/http-kit";

export const ACCESS_TOKEN_ISSUER = "express-microservices-starter:auth";
export const ACCESS_TOKEN_AUDIENCE = "express-microservices-starter:api";
export const SERVICE_TOKEN_ISSUER = "express-microservices-starter:services";
export const SERVICE_TOKEN_AUDIENCE = "express-microservices-starter:internal";

export function createAccessTokenMiddleware(jwksUrl: string): RequestHandler {
  const jwks = createRemoteJWKSet(new URL(jwksUrl), {
    cooldownDuration: 30_000,
    cacheMaxAge: 300_000,
  });

  return async (request, response, next) => {
    const authorization = request.header("authorization");
    const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
    if (!match) {
      next(new HttpError(401, "A bearer access token is required"));
      return;
    }

    try {
      const { payload } = await jwtVerify(match[1], jwks, {
        algorithms: ["EdDSA"],
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      });
      if (
        !payload.sub ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          payload.sub,
        )
      ) {
        throw new HttpError(401, "The access token subject is invalid");
      }
      response.locals.userId = payload.sub;
      next();
    } catch (error) {
      if (error instanceof HttpError) {
        next(error);
      } else if (error instanceof errors.JOSEError) {
        next(new HttpError(401, "The access token is invalid or expired"));
      } else {
        next(new HttpError(503, "Token verification is temporarily unavailable"));
      }
    }
  };
}

export function createServiceTokenSigner(secret: string, serviceName: string) {
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("SERVICE_TOKEN_SECRET must contain at least 32 bytes");
  }
  const key = new TextEncoder().encode(secret);
  return async (): Promise<string> =>
    new SignJWT({ token_use: "service" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(SERVICE_TOKEN_ISSUER)
      .setAudience(SERVICE_TOKEN_AUDIENCE)
      .setSubject(serviceName)
      .setIssuedAt()
      .setExpirationTime("1m")
      .sign(key);
}

export function createServiceTokenMiddleware(
  secret: string,
  allowedServices: readonly string[],
): RequestHandler {
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("SERVICE_TOKEN_SECRET must contain at least 32 bytes");
  }
  const key = new TextEncoder().encode(secret);
  const allowed = new Set(allowedServices);
  return async (request, response, next) => {
    const token = request.header("x-service-token");
    if (!token) {
      next(new HttpError(401, "A service token is required"));
      return;
    }
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ["HS256"],
        issuer: SERVICE_TOKEN_ISSUER,
        audience: SERVICE_TOKEN_AUDIENCE,
      });
      if (payload.token_use !== "service" || !payload.sub || !allowed.has(payload.sub)) {
        throw new HttpError(403, "The calling service is not authorized");
      }
      response.locals.serviceName = payload.sub;
      next();
    } catch (error) {
      if (error instanceof HttpError) next(error);
      else if (error instanceof errors.JOSEError) {
        next(new HttpError(401, "The service token is invalid or expired"));
      } else {
        next(new HttpError(503, "Service token verification is unavailable"));
      }
    }
  };
}
