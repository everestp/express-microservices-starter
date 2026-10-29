# Event Catalog

Events use a versioned subject and envelope:

```json
{
  "eventId": "uuid",
  "type": "note.created.v1",
  "version": 1,
  "occurredAt": "RFC3339 timestamp",
  "data": {}
}
```

| Subject              | Producer      | Data                                        | Consumer      |
| -------------------- | ------------- | ------------------------------------------- | ------------- |
| `user.registered.v1` | auth-service  | `userId`, `email`                           | audit-service |
| `note.created.v1`    | notes-service | `noteId`, `ownerUserId`, `title`            | audit-service |
| `note.updated.v1`    | notes-service | `noteId`, `ownerUserId`, `title`, `version` | audit-service |
| `note.deleted.v1`    | notes-service | `noteId`, `ownerUserId`, `version`          | audit-service |

Producers write outbox rows in the same transaction as their state change. Delivery is at-least-once; consumers must use the event ID as an idempotency key. Deploy a durable JetStream stream, explicit acknowledgement, retry limits, and a dead-letter subject before relying on the starter consumer in production.
