import type {
  EmailBindingInput,
  EmailConnectorDefinition,
  EmailVerifyInput,
  EmailVerifyResult,
} from '@lekki/contracts';
import { createResendEmailBinding } from './resend-connector';

export const RESEND_CONNECTOR_DEFINITION_ID = 'resend';

/**
 * Resend as an EmailConnectorDefinition — credentials are declared, not columns.
 * Platform-level (see email-connector-definition.ts): one binding, bootstrap-only,
 * no per-venue Setup step.
 */
export const resendConnectorDefinition: EmailConnectorDefinition = {
  id: RESEND_CONNECTOR_DEFINITION_ID,
  connectorId: 'connector-resend',
  displayName: 'Resend',
  installable: true,
  bindable: true,
  credentials: [
    { id: 'apiKey', label: 'API key', secret: true, required: true },
    {
      id: 'fromAddress',
      label: 'From address',
      helpText: 'Must be a verified sender on the Resend account',
      secret: false,
      required: true,
    },
  ],
  async verify(input: EmailVerifyInput): Promise<EmailVerifyResult> {
    const apiKey = (input.secrets.apiKey ?? '').trim();
    const fromAddress = (input.config.fromAddress ?? '').trim();
    if (!apiKey) return { ok: false, reason: 'API key is required' };
    if (!fromAddress) return { ok: false, reason: 'From address is required' };
    return { ok: true, config: { fromAddress } };
  },
  createBinding(input: EmailBindingInput) {
    const fromAddress = (input.config.fromAddress ?? '').trim();
    if (!fromAddress) {
      throw new Error('Resend from address is required to activate');
    }
    return createResendEmailBinding(
      {
        resolveApiKey: () => input.resolveSecret('apiKey'),
        fromAddress,
      },
      10,
    );
  },
};
