import type { EventEnvelope } from '@lekki/contracts';

/**
 * Guest session rooms must not receive staff/money-internal envelopes.
 * PUBLIC always ships; otherwise only names the guest UI actually consumes.
 * Staff/operate rooms keep receiving everything (gateway does not use this).
 */
const GUEST_EVENT_ALLOWLIST = new Set([
  'TransactionCreated',
  'LinesClaimed',
  'SessionCompleted',
  'FulfilmentCreated',
  'FulfilmentStatusChanged',
  'PaymentRequested',
  'PaymentCompleted',
  'PaymentFailed',
  'AssistanceRequested',
  'AssistanceAcknowledged',
  'AssistanceResolved',
  'ParticipantJoined',
  'ParticipantDeparted',
]);

export function guestVisibleEvent(
  envelope: Pick<EventEnvelope, 'eventName'> & {
    privacy?: { classification?: string };
  },
): boolean {
  if (envelope.privacy?.classification === 'PUBLIC') return true;
  return GUEST_EVENT_ALLOWLIST.has(envelope.eventName);
}
