# Add a Service

1. Add `services/<name>-service` with `http`, `application`, `domain`, `infrastructure`, and `migrations` folders.
2. Give the service its own workspace package, database URL, SQL schema, readiness probe, and Docker/Kubernetes deployment.
3. Add request/response/event schemas to `packages/contracts`; do not import another service's `src` directory.
4. Add a typed gateway client and public route only if the service needs public access.
5. Add its database, NATS dependencies, and health checks to local Compose and its resource/policy entries to Kustomize.
6. Add tests for ownership, contract compatibility, migrations, and service boundaries.
