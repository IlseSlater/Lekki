export type OrganisationId = string & { readonly brand: unique symbol };
export type VenueId = string & { readonly brand: unique symbol };
export type PhysicalContextId = string & { readonly brand: unique symbol };
export type ExperienceProfileId = string & { readonly brand: unique symbol };
export type ExperienceSessionId = string & { readonly brand: unique symbol };
export type IdentityId = string & { readonly brand: unique symbol };
export type TransactionId = string & { readonly brand: unique symbol };
export type FulfilmentId = string & { readonly brand: unique symbol };
export type PaymentId = string & { readonly brand: unique symbol };
export type CorrelationId = string & { readonly brand: unique symbol };
export type EventId = string & { readonly brand: unique symbol };

export const id = {
  organisation: (v: string) => v as OrganisationId,
  venue: (v: string) => v as VenueId,
  physicalContext: (v: string) => v as PhysicalContextId,
  profile: (v: string) => v as ExperienceProfileId,
  session: (v: string) => v as ExperienceSessionId,
  identity: (v: string) => v as IdentityId,
  transaction: (v: string) => v as TransactionId,
  fulfilment: (v: string) => v as FulfilmentId,
  payment: (v: string) => v as PaymentId,
  correlation: (v: string) => v as CorrelationId,
  event: (v: string) => v as EventId,
};
