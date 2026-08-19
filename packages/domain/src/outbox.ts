import type { CanonicalEventName, EventEnvelope } from '@lekki/contracts';

export interface OutboxMessage {
  id: string;
  eventName: CanonicalEventName;
  envelope: EventEnvelope;
  publishedAt?: Date;
  createdAt: Date;
}

export function createOutboxMessage(
  id: string,
  envelope: EventEnvelope,
): OutboxMessage {
  return {
    id,
    eventName: envelope.eventName as CanonicalEventName,
    envelope,
    createdAt: new Date(),
  };
}
