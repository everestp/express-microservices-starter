# Rotate JWT Keys

1. Generate a new Ed25519 key pair and assign a new `kid`.
2. Deploy auth-service with the new private key and publish both the new and old public keys in JWKS.
3. Wait at least the maximum access-token lifetime plus clock skew.
4. Remove the old public key only after tokens signed by it can no longer be valid.
5. Never commit private key files; production keys belong in a secret manager or mounted secret.
