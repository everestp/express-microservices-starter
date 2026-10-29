import {
  AckPolicy,
  connect,
  DiscardPolicy,
  jetstream,
  jetstreamManager,
  RetentionPolicy,
  StorageType,
  type NatsConnection,
} from "nats";
import { z } from "zod";

export const eventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  type: z.string().min(1),
  version: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  data: z.record(z.unknown()),
});

export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>;
export type EventHandler<T extends EventEnvelope = EventEnvelope> = (event: T) => Promise<void>;

export interface EventBus {
  publish(subject: string, event: EventEnvelope): Promise<void>;
  subscribe(subject: string, handler: EventHandler): Promise<() => Promise<void>>;
  close(): Promise<void>;
}

export async function connectNats(url: string): Promise<EventBus> {
  const connection = await connect({
    servers: url,
    name: "express-microservices-starter",
  });
  return createNatsEventBus(connection);
}

export async function connectJetStreamEventBus(
  url: string,
  options: { streamName?: string; durablePrefix?: string } = {},
): Promise<EventBus> {
  const streamName = options.streamName ?? "DOMAIN_EVENTS";
  const durablePrefix = options.durablePrefix ?? "service";
  const connection = await connect({ servers: url, name: durablePrefix });
  const manager = await jetstreamManager(connection);
  try {
    await manager.streams.info(streamName);
  } catch {
    await manager.streams.add({
      name: streamName,
      subjects: ["user.>", "note.>"],
      retention: RetentionPolicy.Limits,
      storage: StorageType.File,
      discard: DiscardPolicy.Old,
    });
  }
  const js = jetstream(connection);
  const codec = new TextEncoder();

  return {
    async publish(subject, event) {
      const parsed = eventEnvelopeSchema.parse(event);
      await js.publish(subject, codec.encode(JSON.stringify(parsed)));
    },
    async subscribe(subject, handler) {
      const durableName = `${durablePrefix}-${subject.replaceAll(".", "-")}`;
      try {
        await manager.consumers.info(streamName, durableName);
      } catch {
        await manager.consumers.add(streamName, {
          durable_name: durableName,
          filter_subject: subject,
          ack_policy: AckPolicy.Explicit,
          ack_wait: 30_000_000_000,
          max_deliver: 5,
        });
      }
      const consumer = await js.consumers.get(streamName, durableName);
      const messages = await consumer.consume();
      let stopped = false;
      void (async () => {
        for await (const message of messages) {
          if (stopped) break;
          try {
            const event = eventEnvelopeSchema.parse(
              JSON.parse(new TextDecoder().decode(message.data)),
            );
            await handler(event);
            message.ack();
          } catch {
            message.nak();
          }
        }
      })();
      return async () => {
        stopped = true;
        await messages.close();
      };
    },
    close: () => connection.drain(),
  };
}

export function createNatsEventBus(connection: NatsConnection): EventBus {
  const codec = new TextEncoder();
  return {
    async publish(subject, event) {
      const parsed = eventEnvelopeSchema.parse(event);
      connection.publish(subject, codec.encode(JSON.stringify(parsed)));
      await connection.flush();
    },
    async subscribe(subject, handler) {
      const subscription = connection.subscribe(subject);
      void (async () => {
        for await (const message of subscription) {
          try {
            const event = eventEnvelopeSchema.parse(
              JSON.parse(new TextDecoder().decode(message.data)),
            );
            await handler(event);
            message.respond();
          } catch {
            message.respond(new TextEncoder().encode("invalid or failed event"));
          }
        }
      })();
      return async () => subscription.unsubscribe();
    },
    close: () => connection.drain(),
  };
}

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  async publish(subject: string, event: EventEnvelope): Promise<void> {
    const parsed = eventEnvelopeSchema.parse(event);
    await Promise.all([...(this.handlers.get(subject) ?? [])].map((handler) => handler(parsed)));
  }

  async subscribe(subject: string, handler: EventHandler): Promise<() => Promise<void>> {
    const handlers = this.handlers.get(subject) ?? new Set<EventHandler>();
    handlers.add(handler);
    this.handlers.set(subject, handlers);
    return async () => {
      handlers.delete(handler);
    };
  }

  async close(): Promise<void> {
    this.handlers.clear();
  }
}
