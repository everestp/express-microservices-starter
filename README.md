# Express Microservices Starter

A pnpm and Turborepo starter for an Express 5, TypeScript, PostgreSQL, and NATS microservices project. It includes four services, shared contracts and infrastructure packages, EdDSA access tokens, rotating refresh tokens, owner-scoped notes CRUD, an outbox/JetStream starter, observability configuration, and deployment/community scaffolding.

This is a starter with representative implementations, not a production-ready platform. The relay and audit consumer are reusable modules but producers do not automatically start the relay. Production DLQ operations, service-to-service tokens, complete instrumentation, and security hardening remain follow-up work. Do not expose internal service ports to untrusted networks.

## Services and packages

```text
packages/
  contracts/       Initial shared Zod response schemas
  http-kit/        Express app factory, request IDs, and problem responses
  database/        PostgreSQL pools, transactions, and reversible SQL migrations
  service-auth/    EdDSA access-token verification middleware
  service-client/  Typed fetch client with retries and circuit breaker
  event-bus/       NATS JetStream and in-memory event bus adapters
  outbox/          PostgreSQL outbox relay
  telemetry/       OpenTelemetry SDK setup
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

The gateway exposes `GET /healthz` for liveness and `GET /api/v1/health` for downstream dependency checks. Each service exposes `GET /healthz` and a database-backed `GET /readyz`.

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

The gateway listens on `http://localhost:8080`; the auth, notes, and audit services listen on ports 8081, 8082, and 8083. The gateway exposes `POST /api/v1/auth/register`, `/login`, and `/refresh`, plus authenticated `GET`, `POST`, `PUT`, and `DELETE /api/v1/notes` routes. Check `http://localhost:8080/api/v1/health` after all four processes are running. Compose starts PostgreSQL, NATS, and observability tools. Users and notes write events transactionally; the outbox relay module can publish them, but it is not started automatically by the services.

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
- Notes services verify access JWTs through auth-service JWKS, but service-to-service tokens are not implemented.
- The JetStream consumer has explicit acknowledgements and bounded delivery; DLQ routing and replay operations need deployment-specific setup.
- Telemetry, Kubernetes, and CI scaffolding are present; complete instrumentation, production images, and end-to-end integration tests remain follow-up work.

Local database credentials in Compose are for development only. Replace them and add network, identity, migration, backup, and observability controls before using this setup beyond a local machine.
