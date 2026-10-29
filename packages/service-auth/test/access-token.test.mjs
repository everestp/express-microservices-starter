import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { after, before, test } from "node:test";
import express from "express";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  createAccessTokenMiddleware,
} from "../dist/index.js";

const userId = "a4ccf589-24e3-48c8-8876-cb134c1080c9";
let jwksServer;
let appServer;
let jwksUrl;
let appUrl;
let privateKey;

before(async () => {
  const pair = await generateKeyPair("EdDSA");
  privateKey = pair.privateKey;
  const jwk = {
    ...(await exportJWK(pair.publicKey)),
    kid: "test-key",
    use: "sig",
    alg: "EdDSA",
  };
  jwksServer = createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ keys: [jwk] }));
  }).listen(0, "127.0.0.1");
  await once(jwksServer, "listening");
  jwksUrl = `http://127.0.0.1:${jwksServer.address().port}/.well-known/jwks.json`;

  const app = express();
  app.get(
    "/private",
    createAccessTokenMiddleware(jwksUrl),
    (_request, response) => {
      response.status(204).end();
    },
  );
  appServer = app.listen(0, "127.0.0.1");
  await once(appServer, "listening");
  appUrl = `http://127.0.0.1:${appServer.address().port}/private`;
});

after(async () => {
  const closed = Promise.all([
    once(appServer, "close"),
    once(jwksServer, "close"),
  ]);
  appServer.close();
  jwksServer.close();
  await closed;
});

async function signedToken(audience = ACCESS_TOKEN_AUDIENCE) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "EdDSA", kid: "test-key" })
    .setIssuer(ACCESS_TOKEN_ISSUER)
    .setAudience(audience)
    .setSubject(userId)
    .setExpirationTime("1m")
    .sign(privateKey);
}

test("accepts a correctly signed access token", async () => {
  const response = await fetch(appUrl, {
    headers: { authorization: `Bearer ${await signedToken()}` },
  });
  assert.equal(response.status, 204);
});

test("rejects tokens with the wrong audience and missing tokens", async () => {
  const wrongAudience = await fetch(appUrl, {
    headers: { authorization: `Bearer ${await signedToken("other-api")}` },
  });
  const missing = await fetch(appUrl);
  assert.equal(wrongAudience.status, 401);
  assert.equal(missing.status, 401);
});
