import type {
  CorrelationId,
  EventId,
  OrganisationId,
  VenueId,
} from './ids';

export type EventPrivacyClassification = 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';

export interface EventEnvelope<TPayload = Record<string, unknown>> {
  $schema: 'https://schemas.lekki.io/events/v1/envelope.json';
  eventId: EventId;
  eventName: string;
  version: string;
  occurredAt: string;
  producer: string;
  correlationId: CorrelationId;
  causationId?: EventId;
  organisationId: OrganisationId;
  venueId?: VenueId;
  payload: TPayload;
  privacy: {
    containsPii: boolean;
    classification: EventPrivacyClassification;
  };
}

export type CanonicalEventName =
  | 'ExperienceStarted'
  | 'ExperienceContextResolved'
  | 'ParticipantJoined'
  | 'TransactionCreated'
  | 'FulfilmentCreated'
  | 'FulfilmentStatusChanged'
  | 'PaymentRequested'
  | 'PaymentCompleted'
  | 'PaymentFailed'
  | 'SessionCompleted';
