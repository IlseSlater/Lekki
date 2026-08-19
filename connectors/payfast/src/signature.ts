import { createHash } from 'node:crypto';

/**
 * PayFast custom-integration encoding:
 * - trim values
 * - URL-encode with uppercase hex
 * - spaces as '+'
 */
export function pfEncode(value: string): string {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%[0-9a-f]{2}/gi, (hex) => hex.toUpperCase());
}

/**
 * Build the MD5 signature for a PayFast parameter map.
 * Field order must match attribute-description order (insertion order),
 * not alphabetical API order.
 */
export function generateSignature(
  data: Record<string, string>,
  passphrase?: string,
): string {
  const parts: string[] = [];
  for (const [key, raw] of Object.entries(data)) {
    if (key === 'signature') continue;
    if (raw === undefined || raw === null) continue;
    const val = String(raw).trim();
    if (val === '') continue;
    parts.push(`${key}=${pfEncode(val)}`);
  }
  let paramString = parts.join('&');
  if (passphrase && passphrase.trim() !== '') {
    paramString += `&passphrase=${pfEncode(passphrase)}`;
  }
  return createHash('md5').update(paramString).digest('hex');
}

/**
 * ITN signature check — rebuilds the param string from posted fields in
 * arrival order, excluding `signature`, then optionally salts with passphrase.
 */
export function verifyItnSignature(
  posted: Record<string, string>,
  passphrase?: string,
): boolean {
  const received = posted.signature;
  if (!received) return false;

  const parts: string[] = [];
  for (const [key, raw] of Object.entries(posted)) {
    if (key === 'signature') continue;
    parts.push(`${key}=${pfEncode(String(raw))}`);
  }
  let paramString = parts.join('&');
  if (passphrase && passphrase.trim() !== '') {
    paramString += `&passphrase=${pfEncode(passphrase)}`;
  }
  const expected = createHash('md5').update(paramString).digest('hex');
  return expected === received;
}
