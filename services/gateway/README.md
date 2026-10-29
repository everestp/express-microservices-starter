# Gateway

The public API entry point. Public routes live under `/api/v1`, forward to typed service clients, and map downstream failures to problem responses. Internal service URLs are configured with `AUTH_SERVICE_URL`, `NOTES_SERVICE_URL`, and `AUDIT_SERVICE_URL`.

Only this service should be exposed through an ingress. The modular client/controller/router files document the composition pattern; `src/main.ts` is the process entry point.
