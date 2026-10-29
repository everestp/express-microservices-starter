# Add API v2

1. Create `services/gateway/versions/v2.ts` based on `v2.example.ts`.
2. Mount it at `/api/v2` without changing `/api/v1` behavior.
3. Reuse internal service contracts when semantics are unchanged; add explicit adapters when public v2 differs.
4. Add compatibility tests and document deprecation/sunset policy for any replaced v1 routes.
