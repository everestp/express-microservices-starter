export interface AuditEvent {
  id: string;
  eventId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  recordedAt: Date;
}

export interface AuditEventCursor {
  occurredAt: string;
  id: string;
}
