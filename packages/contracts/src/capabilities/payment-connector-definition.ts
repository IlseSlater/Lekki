import type { PaymentConnectorBinding } from './payment';

export type PaymentConnectorEnvironment = 'sandbox' | 'production';

export interface PaymentConnectorCredential {
  id: string;
  label: string;
  helpText?: string;
  /** When true, Studio masks input and runtime stores the value in vaultRefsJson. */
  secret: boolean;
  required: boolean;
  /** If omitted, the field applies to both environments. */
  environments?: PaymentConnectorEnvironment[];
}

export type VerifyInput = {
  organisationId: string;
  venueId: string;
  environment: PaymentConnectorEnvironment;
  /** Non-secret credential values keyed by credential id. */
  config: Record<string, string>;
  /** Plaintext secrets keyed by credential id (verify only — never persisted). */
  secrets: Record<string, string>;
};

export type VerifyResult =
  | {
      ok: true;
      /** Public fields to merge into install configJson. */
      config?: Record<string, string>;
      businessName?: string;
      merchantStatus?: string;
      country?: string;
      currency?: string;
    }
  | { ok: false; reason: string };

export type BindingInput = {
  organisationId: string;
  venueId: string;
  environment: PaymentConnectorEnvironment;
  config: Record<string, string>;
  vaultRefs: Record<string, string>;
  resolveSecret: (secretKey: string) => Promise<string | undefined>;
};

/**
 * Connector contract — Studio and runtime speak only this shape.
 * Adding a gateway means exporting one definition; core LEOS does not grow PayFast columns.
 */
export interface PaymentConnectorDefinition {
  id: string;
  /** Runtime / marketplace connector id (e.g. connector-payfast). */
  connectorId: string;
  displayName: string;
  countries: string[];
  currencies: string[];
  credentials: PaymentConnectorCredential[];
  capabilities: string[];
  installable: boolean;
  /** Env PAYMENT_CONNECTOR / restore may bind this id. */
  bindable: boolean;
  webhook?: {
    pathSuffix: string;
    requiresPublicOrigin: boolean;
  };
  verify(input: VerifyInput): Promise<VerifyResult>;
  createBinding(input: BindingInput): PaymentConnectorBinding;
}
