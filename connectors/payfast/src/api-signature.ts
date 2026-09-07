import { createHash } from 'node:crypto';
import { pfEncode } from './signature';

/**
 * PayFast Merchant API signature — alphabetical key order (not checkout field order).
 * Docs: sort header/body/query vars + passphrase, urlencode, MD5 lowercase hex.
 */
export function generateApiSignature(
  data: Record<string, string>,
  passphrase: string,
): string {
  const entries: Array<[string, string]> = [];
  for (const [key, raw] of Object.entries(data)) {
    if (key === 'signature' || key === 'testing') continue;
    if (raw === undefined || raw === null) continue;
    const val = String(raw).trim();
    if (val === '') continue;
    entries.push([key, val]);
  }
  const pass = passphrase.trim();
  if (pass) entries.push(['passphrase', pass]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  const paramString = entries.map(([k, v]) => `${k}=${pfEncode(v)}`).join('&');
  return createHash('md5').update(paramString).digest('hex');
}
