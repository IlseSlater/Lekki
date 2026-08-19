import { randomUUID } from 'crypto';
import type { CorrelationId, EventId } from '@lekki/contracts';

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export function newCorrelationId(): CorrelationId {
  return newId('corr') as CorrelationId;
}

export function newEventId(): EventId {
  return newId('evt') as EventId;
}
