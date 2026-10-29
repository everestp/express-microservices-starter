# Audit Service

Owns append-only audit events and processed-event IDs. The consumer starter deduplicates messages by event ID and writes the dedupe record and audit row in one transaction.

Configure `AUDIT_DATABASE_URL` and `NATS_URL`. Durable JetStream consumers, explicit ack policy, retry limits, and dead-letter handling are deployment follow-up work.
