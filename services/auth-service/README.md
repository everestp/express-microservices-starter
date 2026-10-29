# Auth Service

Owns user credentials, refresh-token families, and EdDSA signing keys. The service exposes registration, login, refresh rotation, and `/.well-known/jwks.json` on internal routes. Configure `AUTH_DATABASE_URL`, `JWT_PRIVATE_KEY_FILE`, `JWT_PUBLIC_KEY_FILE`, and `JWT_KEY_ID`.

Generate local keys with `pnpm keys:generate`. Never commit the private JWK or use the development key in production.
