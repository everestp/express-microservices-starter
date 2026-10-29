# Add an Endpoint

1. Define request and response schemas in `packages/contracts/src/`.
2. Add the internal route and application behavior in the owning service.
3. Keep SQL in that service's repository and add a migration if storage changes.
4. Add a typed client method and gateway route only when the endpoint is public.
5. Add route/contract tests and update the OpenAPI registry and service guide.
