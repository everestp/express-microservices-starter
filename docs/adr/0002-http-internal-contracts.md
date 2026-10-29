# ADR 0002: Internal HTTP Contracts

## Status

Accepted

## Decision

Use JSON over internal HTTP with shared Zod contracts for request/response validation. Keep service boundaries easy to inspect with standard HTTP tooling.

## Consequences

Services remain independently deployable and language migration is possible, but HTTP adds serialization overhead. Consider gRPC only when streaming or strongly generated cross-language contracts become a concrete requirement.
