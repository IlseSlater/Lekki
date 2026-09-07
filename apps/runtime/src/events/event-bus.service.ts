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

  /**
   * At-least-once. The eventId is recorded as delivered only after every
   * handler has succeeded — marking before the fan-out made an outbox retry a
   * silent no-op that the publisher then recorded as published, so a single
   * transient handler failure dropped the event permanently.
   *
   * The trade: if handler 2 throws after handler 1 succeeded, the retry
   * re-runs handler 1. That is the correct semantic for an outbox, and
   * handlers must be idempotent.
   */
  async publish(envelope: EventEnvelope) {
    if (this.seen.has(envelope.eventId)) {
      return;
    }
    for (const handler of this.handlers) {
      await handler(envelope);
    }
    this.seen.add(envelope.eventId);
    if (this.seen.size > 10_000) {
      const first = this.seen.values().next().value;
      if (first) this.seen.delete(first);
    }
  }
}
