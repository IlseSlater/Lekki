/**
 * PayFast merchant probe — GET /ping authenticates merchant-id + passphrase.
 * merchant_key is required by LEOS for checkout forms but is not verified by /ping
 * (Option A — honest UI copy).
 */

import { generateApiSignature } from './api-signature';

export type PayFastProbeInput = {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  environment: 'sandbox' | 'production';
  fetchImpl?: typeof fetch;
  /** Override ping URL (tests). */
  pingUrl?: string;
};

export type PayFastProbeResult =
  | {
      ok: true;
      /** Honest: /ping does not return a business name lookup. */
      businessName: string;
      /** Honest: merchant_key was supplied but not verified by /ping. */
      merchantStatus: 'Merchant ID + passphrase accepted by /ping';
      environment: 'sandbox' | 'production';
    }
  | { ok: false; reason: string };

/** Documented ping acks — compared case-insensitively (PayFast vs Payfast). */
const ACCEPTED_PING_BODIES = new Set(['payfast api', 'api v1']);

export function payFastPingUrl(environment: 'sandbox' | 'production'): string {
  // PayFast Merchant API uses api.payfast.co.za; sandbox is marked with testing=true.
  if (environment === 'sandbox') {
    return 'https://api.payfast.co.za/ping?testing=true';
  }
  return 'https://api.payfast.co.za/ping';
}

function normalizePingAck(value: string): string {
  return value.trim().replace(/^\uFEFF/, '').replace(/^"|"$/g, '').replace(/\s+/g, ' ').toLowerCase();
}

/** Bare string or PayFast JSON envelope — never a substring match. */
export function pingAckFromBody(raw: string):
  | { ok: true; ack: string }
  | { ok: false; reason: string } {
  const trimmed = raw.trim().replace(/^\uFEFF/, '');
  const unquoted = normalizePingAck(trimmed);
  if (ACCEPTED_PING_BODIES.has(unquoted)) {
    return { ok: true, ack: unquoted };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const ack = ackFromJson(parsed);
    if (ack && ACCEPTED_PING_BODIES.has(normalizePingAck(ack))) {
      const failed = jsonIndicatesFailure(parsed);
      if (failed) {
        return { ok: false, reason: 'Could not verify credentials with PayFast. Please check your details.' };
      }
      return { ok: true, ack };
    }
    if (jsonIndicatesFailure(parsed)) {
      return {
        ok: false,
        reason: 'Could not verify credentials with PayFast. Please check your details.',
      };
    }
  } catch {
    // not JSON
  }

  return {
    ok: false,
    reason: 'Unexpected response from PayFast — credentials were not confirmed',
  };
}

function ackFromJson(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const s = value.trim().replace(/^"|"$/g, '');
    return s || undefined;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const rec = value as Record<string, unknown>;
  if (typeof rec.response === 'string') return rec.response.trim();
  const data = rec.data;
  if (typeof data === 'string') return data.trim();
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (typeof inner.response === 'string') return inner.response.trim();
  }
  return undefined;
}

function jsonIndicatesFailure(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const rec = value as Record<string, unknown>;
  if (rec.status === 'failed' || rec.status === 'error') return true;
  if (typeof rec.code === 'number' && rec.code >= 400) return true;
  return false;
}

function isoTimestamp(): string {
  // PayFast examples use offset; +02:00 is their default when omitted.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${oh}:${om}`;
}

export async function probeMerchantCredentials(
  input: PayFastProbeInput,
): Promise<PayFastProbeResult> {
  const merchantId = input.merchantId.trim();
  const merchantKey = input.merchantKey.trim();
  const passphrase = input.passphrase.trim();
  if (!merchantId || merchantId.length < 5) {
    return { ok: false, reason: 'Merchant ID looks incomplete' };
  }
  if (!merchantKey || merchantKey.length < 5) {
    return { ok: false, reason: 'Merchant key looks incomplete' };
  }
  if (!passphrase) {
    return { ok: false, reason: 'Passphrase is required for PayFast API and ITN verification' };
  }

  const timestamp = isoTimestamp();
  const version = 'v1';
  const signature = generateApiSignature(
    {
      'merchant-id': merchantId,
      version,
      timestamp,
    },
    passphrase,
  );

  const pingUrl = input.pingUrl ?? payFastPingUrl(input.environment);
  const fetchImpl = input.fetchImpl ?? fetch;

  let res: Response;
  try {
    res = await fetchImpl(pingUrl, {
      method: 'GET',
      headers: {
        'merchant-id': merchantId,
        version,
        timestamp,
        signature,
      },
    });
  } catch {
    return { ok: false, reason: 'Could not reach PayFast — check network and try again' };
  }

  const body = await res.text();
  if (!res.ok) {
    if (res.status === 401 || res.status === 400) {
      return {
        ok: false,
        reason: 'Could not verify credentials with PayFast. Please check your details.',
      };
    }
    return {
      ok: false,
      reason: `PayFast returned ${res.status} — try again or check your dashboard`,
    };
  }

  const ack = pingAckFromBody(body);
  if (!ack.ok) {
    return { ok: false, reason: ack.reason };
  }

  return {
    ok: true,
    businessName:
      input.environment === 'production'
        ? 'PayFast (production /ping)'
        : 'PayFast (sandbox /ping)',
    merchantStatus: 'Merchant ID + passphrase accepted by /ping',
    environment: input.environment,
  };
}
