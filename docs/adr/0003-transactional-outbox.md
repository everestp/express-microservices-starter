# ADR 0003: Transactional Outbox

## Status

Accepted

## Decision

Persist each domain event in the owning service's database transaction, then publish it asynchronously from an outbox relay.

## Consequences

Business updates cannot commit without their event record. Delivery is at-least-once, so consumers deduplicate by event ID and operators monitor relay lag and failed deliveries.
