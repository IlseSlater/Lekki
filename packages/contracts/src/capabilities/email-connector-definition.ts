import type { EmailConnectorBinding } from './email';

export interface EmailConnectorCredential {
  id: string;
  label: string;
  helpText?: string;
  secret: boolean;
  required: boolean;
}

export type EmailVerifyInput = {
  config: Record<string, string>;
  secrets: Record<string, string>;
};

export type EmailVerifyResult =
  | {
      ok: true;
      config?: Record<string, string>;
    }
  | { ok: false; reason: string };

export type EmailBindingInput = {
  config: Record<string, string>;
  resolveSecret: (secretKey: string) => Promise<string | undefined>;
};

/**
 * Connector contract — Studio and runtime speak only this shape.
 * Platform-level, unlike payments: no organisationId/venueId/environment.
 * Email is LEOS's own sending capability, not an owner-configured Setup step —
 * one connector is bound once at bootstrap, never per-venue.
 */
export interface EmailConnectorDefinition {
  id: string;
  /** Runtime connector id (e.g. connector-resend). */
  connectorId: string;
  displayName: string;
  credentials: EmailConnectorCredential[];
  installable: boolean;
  /** Env RESEND_API_KEY (or equivalent) present at bootstrap may bind this id. */
  bindable: boolean;
  verify(input: EmailVerifyInput): Promise<EmailVerifyResult>;
  createBinding(input: EmailBindingInput): EmailConnectorBinding;
}
