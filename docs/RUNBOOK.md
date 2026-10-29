# Runbook

## Readiness failures

Check `GET /readyz` on the affected service, then inspect that service's database URL and PostgreSQL health. A database outage should fail readiness without changing liveness.

## Authentication failures

Check the auth-service key file paths and key ID, then verify `/.well-known/jwks.json` through the gateway. Keep the public key available for at least the lifetime of every issued access token when rotating keys.

## Outbox backlog

Inspect the service-local `outbox` table for rows with `published_at IS NULL`, `attempts`, and `last_error`. Do not delete unpublished rows during recovery. The relay and DLQ operational commands are not yet implemented.

## Local stack reset

`pnpm docker:down` stops containers but preserves named volumes. To remove local database data, explicitly run `docker compose -f deploy/compose/docker-compose.yml down -v`.
