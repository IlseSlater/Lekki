export interface SendEmailAttachment {
  filename: string;
  /** Base64-encoded content. */
  content: string;
  contentType: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: SendEmailAttachment[];
}

export interface SendEmailResult {
  ok: boolean;
  providerMessageId?: string;
  reason?: string;
}

export interface EmailCapability {
  readonly connectorId: string;
  send(request: SendEmailRequest): Promise<SendEmailResult>;
}

export interface EmailConnectorBinding {
  connectorId: string;
  capability: EmailCapability;
  priority: number;
}
