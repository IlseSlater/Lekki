import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Pilot POS webhook auth — shared secret bearer or HMAC-SHA256 over raw body.
 * Pure; no Nest. Fail closed when secret is missing.
 */

export function timingSafeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Authorization: Bearer <token> or X-Pilot-Webhook-Token: <token> */
export function verifyPilotWebhookToken(
  provided: string | undefined | null,
  expectedSecret: string,
): boolean {
  const got = (provided ?? '').trim();
  const want = expectedSecret.trim();
  if (!got || !want) return false;
  const token = got.toLowerCase().startsWith('bearer ')
    ? got.slice(7).trim()
    : got;
  return timingSafeEqualText(token, want);
}

/**
 * X-Pilot-Signature: hex HMAC-SHA256 of the raw request body.
 * Used when Pilot signs payloads instead of a static bearer.
 */
export function verifyPilotWebhookHmac(
  rawBody: string,
  signatureHeader: string | undefined | null,
  secret: string,
): boolean {
  const sig = (signatureHeader ?? '').trim().toLowerCase().replace(/^sha256=/, '');
  const want = secret.trim();
  if (!sig || !want) return false;
  const expected = createHmac('sha256', want).update(rawBody, 'utf8').digest('hex');
  return timingSafeEqualText(sig, expected);
}

export function assertPilotWebhookAuthorized(input: {
  secret: string;
  bearerOrTokenHeader?: string | null;
  signatureHeader?: string | null;
  rawBody?: string;
}): void {
  const secret = input.secret.trim();
  if (!secret) {
    const err = new Error('PILOT_POS_WEBHOOK_SECRET is not configured');
    err.name = 'PilotWebhookUnauthorizedError';
    throw err;
  }
  if (verifyPilotWebhookToken(input.bearerOrTokenHeader, secret)) return;
  if (
    input.rawBody != null &&
    verifyPilotWebhookHmac(input.rawBody, input.signatureHeader, secret)
  ) {
    return;
  }
  const err = new Error('Invalid Pilot webhook credentials');
  err.name = 'PilotWebhookUnauthorizedError';
  throw err;
}
