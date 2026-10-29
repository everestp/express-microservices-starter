# Notes Service

Owns notes and the notes outbox. CRUD routes require an EdDSA access token; the service obtains public signing keys from `AUTH_JWKS_URL`. Reads and writes are scoped to the verified token subject. Updates and deletes require the current note version.

Configure `NOTES_DATABASE_URL` and `AUTH_JWKS_URL`. Apply migrations before starting the service.
