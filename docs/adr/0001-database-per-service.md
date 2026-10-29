# ADR 0001: Database per Service

## Status

Accepted

## Decision

Each service owns its database and schema. Other services access its behavior through HTTP contracts or events, never by querying its tables.

## Consequences

Services deploy and migrate independently. Cross-service workflows are eventually consistent and require events, retries, and idempotent consumers rather than shared SQL transactions.
