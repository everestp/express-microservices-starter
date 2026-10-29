import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { importJWK, SignJWT, type JWK, type KeyLike } from "jose";
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
} from "@starter/service-auth";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface TokenService {
  signAccessToken(userId: string): Promise<string>;
  publicJwk: Record<string, unknown>;
}

export async function loadTokenService(
  privateKeyPath: string,
  publicKeyPath: string,
  keyId: string,
): Promise<TokenService> {
  const [privateText, publicText] = await Promise.all([
    readFile(privateKeyPath, "utf8"),
    readFile(publicKeyPath, "utf8"),
  ]);
  const privateJwk = JSON.parse(privateText) as JWK & { kid?: string };
  const publicJwk = JSON.parse(publicText) as JWK & {
    kid?: string;
    d?: string;
  };
  if (
    privateJwk.kty !== "OKP" ||
    privateJwk.crv !== "Ed25519" ||
    typeof privateJwk.d !== "string" ||
    publicJwk.kty !== "OKP" ||
    publicJwk.crv !== "Ed25519" ||
    typeof publicJwk.x !== "string" ||
    publicJwk.d
  ) {
    throw new Error(
      "JWT key files must contain an Ed25519 private JWK and a public-only JWK",
    );
  }

  privateJwk.kid = keyId;
  publicJwk.kid = keyId;
  publicJwk.use = "sig";
  publicJwk.alg = "EdDSA";
  const signingKey = (await importJWK(privateJwk, "EdDSA")) as KeyLike;

  return {
    publicJwk,
    async signAccessToken(userId: string): Promise<string> {
      return new SignJWT({})
        .setProtectedHeader({ alg: "EdDSA", kid: keyId, typ: "JWT" })
        .setIssuer(ACCESS_TOKEN_ISSUER)
        .setAudience(ACCESS_TOKEN_AUDIENCE)
        .setSubject(userId)
        .setJti(randomUUID())
        .setIssuedAt()
        .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
        .sign(signingKey);
    },
  };
}
