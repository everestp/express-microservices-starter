# Express Microservices Starter

A pnpm and Turborepo starter for an Express 5, TypeScript, PostgreSQL, and NATS microservices project. It includes four services, shared contracts and infrastructure packages, EdDSA access tokens, rotating refresh tokens, owner-scoped notes CRUD, an outbox/JetStream starter, observability configuration, and deployment/community scaffolding.

This is a starter with representative implementations, not a production-ready platform. Internal routes require short-lived gateway service tokens; notes and audit also verify user access tokens. The outbox relay is reusable but producers do not automatically start it. Production DLQ operations, complete tracing, and security hardening remain follow-up work. Do not expose internal service ports to untrusted networks.

## Services and packages

```text
packages/
  contracts/       Shared Zod request, response, and event schemas
  http-kit/        Express app factory, request IDs, and problem responses
  database/        PostgreSQL pools, transactions, and reversible SQL migrations
  service-auth/    EdDSA access-token and HMAC service-token helpers
  service-client/  Typed fetch client with retries and circuit breaker
  event-bus/       NATS JetStream and in-memory event bus adapters
  outbox/          PostgreSQL outbox relay
  telemetry/       OpenTelemetry SDK and Prometheus metrics helpers
  logger/          Structured pino logger with redaction
  config-kit/      Zod environment parsing and redacted summaries
  errors/          Shared application error types
  clock/           Injectable system and fixed clocks
  eslint-config/   Shared lint rules and service import boundary
  tsconfig/        Shared TypeScript presets
services/
  gateway/         Public entry point, typed clients, controllers, and versioned routers
  auth-service/    Registration, login, refresh rotation, JWKS, and layered examples
  notes-service/   JWT-protected CRUD, ownership, pagination, and version checks
  audit-service/   PostgreSQL consumer with event-ID deduplication
  each service/    Dockerfile, package scripts, config, migrations, and service guide
deploy/
  compose/         PostgreSQL, NATS, Jaeger, Prometheus, Grafana, and OTel Collector
  k8s/             Kustomize base and dev/prod overlays
docs/              Architecture, event catalog, runbook, how-to guides, ADRs
.github/           CI, CodeQL, release workflow, templates, ownership, Dependabot
```

The gateway exposes `GET /healthz`, `/metrics`, and `/api/v1/health`. Each internal service exposes `GET /healthz` and a database-backed `GET /readyz`.

## Requirements

- Node.js 22.9 or newer
- pnpm 10.12.1 (Corepack can provide it after you approve its download)
- Docker Compose

## Run locally

```sh
cp .env.example .env
pnpm install
docker compose -f deploy/compose/docker-compose.yml up -d
pnpm keys:generate
pnpm migrate:all
pnpm dev
```

Replace the example `SERVICE_TOKEN_SECRET` in `.env` with a unique random value of at least 32 bytes before using the internal services beyond local development.

The gateway listens on `http://localhost:8080`; the auth, notes, and audit services listen on ports 8081, 8082, and 8083. The gateway exposes auth registration/login/refresh and authenticated notes CRUD. Check `/api/v1/health` and `/metrics` after startup. Compose starts PostgreSQL, NATS, Jaeger, Prometheus, Grafana, and the OTel Collector. User and note events are written transactionally; the reusable outbox relay is not started automatically.

Example flow:

```sh
curl -s -X POST localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"me@example.com","password":"a-long-example-password"}'

TOKEN=$(curl -s -X POST localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"me@example.com","password":"a-long-example-password"}' | jq -r .accessToken)

curl -s -X POST localhost:8080/api/v1/notes \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Hello","content":"First note"}'
```

Stop the dependencies with:

```sh
pnpm docker:down
```

## Workspace commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm --filter notes-service dev
pnpm --filter notes-service migrate:down
```

## Current limitations

- Refresh tokens are returned in JSON; store them securely and do not place them in browser local storage.
- Notes and audit verify user JWTs through auth-service JWKS and require the gateway's short-lived service token.
- The JetStream consumer has explicit acknowledgements and bounded delivery; DLQ routing and replay operations need deployment-specific setup.
- Kubernetes and CI scaffolding are present. OTel SDK setup is available but is not automatically started by every service; production images and full-stack integration tests remain follow-up work.

Local database credentials in Compose are for development only. Replace them and add network, identity, migration, backup, and observability controls before using this setup beyond a local machine.
