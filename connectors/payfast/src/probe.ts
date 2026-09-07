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
  /** Override ping URL (tests). Default https://api.payfast.co.za/ping */
  pingUrl?: string;
};

export type PayFastProbeResult =
  | {
      ok: true;
      businessName: string;
      merchantStatus: 'Verified Merchant & Passphrase';
      environment: 'sandbox' | 'production';
    }
  | { ok: false; reason: string };

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

  const pingUrl = input.pingUrl ?? 'https://api.payfast.co.za/ping';
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

  const body = (await res.text()).trim().replace(/^"|"$/g, '');
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

  const known =
    body === 'Payfast API' ||
    body === 'API V1' ||
    body.toLowerCase().includes('payfast') ||
    body.toLowerCase().includes('api');
  if (!known) {
    return {
      ok: false,
      reason: 'Unexpected response from PayFast — credentials were not confirmed',
    };
  }

  return {
    ok: true,
    businessName:
      input.environment === 'production' ? 'PayFast Merchant' : 'PayFast Sandbox Merchant',
    merchantStatus: 'Verified Merchant & Passphrase',
    environment: input.environment,
  };
}
