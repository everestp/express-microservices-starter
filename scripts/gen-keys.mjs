import { generateKeyPairSync } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve("keys");
const keyId = process.env.JWT_KEY_ID ?? "dev-1";
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const privateJwk = {
  ...privateKey.export({ format: "jwk" }),
  kid: keyId,
  use: "sig",
  alg: "EdDSA",
};
const publicJwk = {
  ...publicKey.export({ format: "jwk" }),
  kid: keyId,
  use: "sig",
  alg: "EdDSA",
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, "jwt-private.jwk.json"),
  `${JSON.stringify(privateJwk, null, 2)}\n`,
  {
    mode: 0o600,
  },
);
await writeFile(
  resolve(outputDirectory, "jwt-public.jwk.json"),
  `${JSON.stringify(publicJwk, null, 2)}\n`,
  {
    mode: 0o644,
  },
);
console.info(`Generated Ed25519 JWT keys in ${outputDirectory}`);
