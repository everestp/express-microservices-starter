# API Versioning

Public routes live under `/api/v1`. Add a new router under `services/gateway/versions`, mount it explicitly, and leave existing v1 request/response behavior unchanged. For deprecated routes, use the gateway deprecation middleware and publish a UTC `Sunset` date with a migration guide. Internal service contracts are versioned independently from the public API.
