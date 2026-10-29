# Express Microservices Starter

A pnpm and Turborepo workspace foundation for an Express 5, TypeScript, PostgreSQL, and NATS microservices project. It includes four independently runnable service entry points, shared HTTP middleware, initial Zod contracts, and local dependency containers.

This repository is an initial scaffold, not a production-ready implementation of the full architecture. Authentication, note persistence, event publishing/consumption, tracing, deployment manifests, and production security controls are not implemented yet. Do not expose these services to untrusted networks.

## Services and packages

```text
packages/
  contracts/       Initial shared Zod response schemas
  http-kit/        Express app factory, request IDs, and problem responses
services/
  gateway/         Public entry point and dependency health aggregation
  auth-service/    Service entry point and liveness endpoint
  notes-service/   Service entry point and liveness endpoint
  audit-service/   Service entry point and liveness endpoint
deploy/
  compose/         Local PostgreSQL and NATS dependencies
```

The gateway exposes `GET /healthz` for liveness and `GET /api/v1/health` for downstream dependency checks. Each service exposes `GET /healthz`.

## Requirements

- Node.js 22 or newer
- pnpm 10.12.1 (Corepack can provide it after you approve its download)
- Docker Compose

## Run locally

```sh
pnpm install
docker compose -f deploy/compose/docker-compose.yml up -d
pnpm dev
```

The gateway listens on `http://localhost:8080`; the auth, notes, and audit services listen on ports 8081, 8082, and 8083. Check `http://localhost:8080/api/v1/health` after all four processes are running. The Compose file starts dependency infrastructure only; the applications currently do not connect to PostgreSQL or NATS.

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
```

## Planned implementation

The next slices are service-specific database repositories and migrations; registration and token handling; authenticated notes CRUD; transactional outbox and idempotent NATS consumers; typed internal clients and service authentication; then tracing, metrics, container images, Kubernetes manifests, and integration tests. Keep each service's data access and business logic within that service, and share contracts rather than domain behavior.

Local database credentials in Compose are for development only. Replace them and add network, identity, migration, backup, and observability controls before using this setup beyond a local machine.