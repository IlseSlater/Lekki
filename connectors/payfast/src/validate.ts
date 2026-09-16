/**
 * Confirm an ITN payload with PayFast's query/validate endpoint.
 * Returns true when PayFast responds with VALID.
 *
 * PayFast rejects JSON and can hang; always URL-encode, abort, fail closed.
 */
export async function confirmItnWithPayFast(
  itnPayload: Record<string, string>,
  validateUrl: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 10_000,
): Promise<boolean> {
  const params = new URLSearchParams();
  for (const key of Object.keys(itnPayload)) {
    if (Object.prototype.hasOwnProperty.call(itnPayload, key)) {
      params.append(key, itnPayload[key]);
    }
  }

  const controller = new AbortController();
  let capTimer: ReturnType<typeof setTimeout> | undefined;

  const attempt = (async (): Promise<boolean> => {
    try {
      const response = await fetchImpl(validateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Lekki-Server/1.0',
        },
        body: params.toString(),
        signal: controller.signal,
      });
      const resultText = (await response.text()).trim();
      return resultText === 'VALID';
    } catch {
      return false;
    }
  })();

  const cap = new Promise<boolean>((resolve) => {
    capTimer = setTimeout(() => {
      controller.abort();
      resolve(false);
    }, timeoutMs);
  });

  try {
    return await Promise.race([attempt, cap]);
  } finally {
    if (capTimer) clearTimeout(capTimer);
  }
}

export function formatPayFastAmount(amount: number): string {
  return amount.toFixed(2);
}

/** Absolute tolerance for ZAR string ↔ major Decimal compare (2dp). */
export const PAYFAST_AMOUNT_EPSILON = 0.01;

export type ItnAmountCheck =
  | { ok: true; amountGross: number }
  | { ok: false; reason: string; amountGross?: number; code: 'missing_gross' | 'underpay' | 'mismatch' };

/**
 * Anti-spoof: ITN amount_gross must match the Payment.amount we created.
 * Underpay (form tamper R500 → R1) is an explicit hard fail.
 */
export function checkItnAmountGross(
  expectedMajor: number,
  amountGrossRaw: string | undefined,
): ItnAmountCheck {
  if (amountGrossRaw === undefined || String(amountGrossRaw).trim() === '') {
    return {
      ok: false,
      reason: 'Missing amount_gross — refusing settlement',
      code: 'missing_gross',
    };
  }
  const amountGross = Number.parseFloat(String(amountGrossRaw));
  if (!Number.isFinite(amountGross)) {
    return {
      ok: false,
      reason: `Invalid amount_gross: ${amountGrossRaw}`,
      code: 'missing_gross',
    };
  }
  if (amountGross + PAYFAST_AMOUNT_EPSILON < expectedMajor) {
    return {
      ok: false,
      reason: `Amount underpay spoof blocked: expected ${expectedMajor}, got ${amountGross}`,
      amountGross,
      code: 'underpay',
    };
  }
  if (Math.abs(expectedMajor - amountGross) > PAYFAST_AMOUNT_EPSILON) {
    return {
      ok: false,
      reason: `Amount mismatch: expected ${expectedMajor}, got ${amountGross}`,
      amountGross,
      code: 'mismatch',
    };
  }
  return { ok: true, amountGross };
}

export type PayFastPaymentStatus =
  | 'COMPLETE'
  | 'FAILED'
  | 'PENDING'
  | 'CANCELLED'
  | string;

export function mapItnStatus(paymentStatus: string | undefined): 'settled' | 'failed' | 'pending' {
  switch ((paymentStatus ?? '').toUpperCase()) {
    case 'COMPLETE':
      return 'settled';
    case 'FAILED':
    case 'CANCELLED':
      return 'failed';
    default:
      return 'pending';
  }
}
