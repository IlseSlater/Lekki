/**
 * Confirm an ITN payload with PayFast's query/validate endpoint.
 * Returns true when PayFast responds with VALID.
 */
export async function confirmItnWithPayFast(
  posted: Record<string, string>,
  validateUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(posted)) {
    body.append(key, value);
  }

  const response = await fetchImpl(validateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const text = (await response.text()).trim();
  return text === 'VALID';
}

export function formatPayFastAmount(amount: number): string {
  return amount.toFixed(2);
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
