import type { EmailCapability, SendEmailRequest, SendEmailResult } from '@lekki/contracts';

export const RESEND_CONNECTOR_ID = 'connector-resend';

export type ResendConnectorConfig = {
  /** Resolved lazily, per send — mirrors the PayFast connector's resolveSecret pattern. */
  resolveApiKey: () => Promise<string | undefined>;
  /** Resend requires a verified sending address/domain. */
  fromAddress: string;
  fetchImpl?: typeof fetch;
};

export class ResendEmailConnector implements EmailCapability {
  readonly connectorId = RESEND_CONNECTOR_ID;

  constructor(private readonly config: ResendConnectorConfig) {}

  async send(request: SendEmailRequest): Promise<SendEmailResult> {
    const apiKey = await this.config.resolveApiKey();
    if (!apiKey) {
      return { ok: false, reason: 'Resend API key could not be resolved' };
    }
    const fetchImpl = this.config.fetchImpl ?? fetch;
    let res: Response;
    try {
      res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.config.fromAddress,
          to: request.to,
          subject: request.subject,
          text: request.text,
          html: request.html,
          attachments: request.attachments?.map((a) => ({
            filename: a.filename,
            content: a.content,
          })),
        }),
      });
    } catch {
      return { ok: false, reason: 'Could not reach Resend — check network and try again' };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, reason: `Resend returned ${res.status}${body ? `: ${body}` : ''}` };
    }

    const body = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, providerMessageId: body.id };
  }
}

export function createResendEmailBinding(config: ResendConnectorConfig, priority = 10) {
  const capability = new ResendEmailConnector(config);
  return {
    connectorId: capability.connectorId,
    capability,
    priority,
  };
}
