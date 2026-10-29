# Add an Event

1. Define or update the event envelope contract and versioned subject.
2. Build the event in the producer's `src/events/` folder.
3. Insert the outbox row in the same transaction as the business change.
4. Add the consumer handler and dedupe by `eventId` in the consumer database transaction.
5. Document ownership, payload, compatibility, retries, and replay in `docs/EVENTS.md`.
