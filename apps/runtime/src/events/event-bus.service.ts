import { Injectable } from '@nestjs/common';
import type { EventEnvelope } from '@lekki/contracts';

export type EventHandler = (envelope: EventEnvelope) => void | Promise<void>;

/** In-process bus with idempotent delivery by eventId. */
@Injectable()
export class EventBusService {
  private handlers: EventHandler[] = [];
  private seen = new Set<string>();

  subscribe(handler: EventHandler) {
    this.handlers.push(handler);
  }

  async publish(envelope: EventEnvelope) {
    if (this.seen.has(envelope.eventId)) {
      return;
    }
    this.seen.add(envelope.eventId);
    if (this.seen.size > 10_000) {
      const first = this.seen.values().next().value;
      if (first) this.seen.delete(first);
    }
    for (const handler of this.handlers) {
      await handler(envelope);
    }
  }
}
