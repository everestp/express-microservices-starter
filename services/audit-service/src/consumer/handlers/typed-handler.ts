import type { EventEnvelope, EventHandler } from "@starter/event-bus";

export function forEventType(type: string, handler: EventHandler): EventHandler {
  return async (event: EventEnvelope) => {
    if (event.type !== type) throw new Error(`Expected ${type}, received ${event.type}`);
    await handler(event);
  };
}
