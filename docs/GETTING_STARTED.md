# Getting Started

1. Install Node.js 22.9+ and pnpm 10.12.1.
2. Copy `.env.example` to `.env` and generate a local signing key pair with `pnpm keys:generate`.
3. Start local PostgreSQL and NATS with `pnpm docker:up`.
4. Install dependencies with `pnpm install`.
5. Apply service migrations with `pnpm migrate:all`.
6. Start the workspace with `pnpm dev` and check `http://localhost:8080/healthz`.

Register and log in through the gateway, then use the returned bearer access token on `/api/v1/notes`. Refresh tokens are one-time credentials and should be stored in a secure client-side mechanism appropriate to the application.

The Compose stack is for local development. It does not configure production secrets, TLS, backups, or a durable JetStream cluster.
