import type {
  EmailBindingInput,
  EmailCapability,
  EmailConnectorDefinition,
  EmailVerifyInput,
  EmailVerifyResult,
  SendEmailRequest,
  SendEmailResult,
} from '@lekki/contracts';

export const FAKE_EMAIL_CONNECTOR_ID = 'connector-fake-email';

export type SentFakeEmail = SendEmailRequest & { sentAt: string };

/**
 * Dev/test stand-in — records instead of sending. Default binding when
 * RESEND_API_KEY isn't set, so a missing env var is never a silent crash.
 */
export class FakeEmailConnector implements EmailCapability {
  readonly connectorId = FAKE_EMAIL_CONNECTOR_ID;
  readonly sent: SentFakeEmail[] = [];

  async send(request: SendEmailRequest): Promise<SendEmailResult> {
    this.sent.push({ ...request, sentAt: new Date().toISOString() });
    return { ok: true, providerMessageId: `fake_${this.sent.length}` };
  }
}

export function createFakeEmailBinding(priority = 10) {
  const capability = new FakeEmailConnector();
  return {
    connectorId: capability.connectorId,
    capability,
    priority,
  };
}

export const fakeEmailConnectorDefinition: EmailConnectorDefinition = {
  id: 'fake',
  connectorId: FAKE_EMAIL_CONNECTOR_ID,
  displayName: 'Fake Email',
  installable: false,
  bindable: true,
  credentials: [],
  async verify(_input: EmailVerifyInput): Promise<EmailVerifyResult> {
    return { ok: false, reason: 'Fake connector is not installable' };
  },
  createBinding(_input: EmailBindingInput) {
    return createFakeEmailBinding(10);
  },
};
