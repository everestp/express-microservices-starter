import { errors, createRemoteJWKSet, jwtVerify } from "jose";
import type { RequestHandler } from "express";
import { HttpError } from "@starter/http-kit";

export const ACCESS_TOKEN_ISSUER = "express-microservices-starter:auth";
export const ACCESS_TOKEN_AUDIENCE = "express-microservices-starter:api";

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
        next(
          new HttpError(503, "Token verification is temporarily unavailable"),
        );
      }
    }
  };
}
