/**
 * Public notify URL for PayFast ITNs — never default to the runtime's localhost.
 */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

export function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host) return true;
  if (LOOPBACK_HOSTS.has(host)) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Resolve the PayFast ITN notify URL.
 * Requires an explicit override, PAYFAST_NOTIFY_URL, or PUBLIC_RUNTIME_ORIGIN.
 */
export function resolvePayFastNotifyUrl(override?: string): string {
  const fromOverride = override?.trim();
  if (fromOverride) return stripTrailingSlash(fromOverride);

  const fromEnv = process.env.PAYFAST_NOTIFY_URL?.trim();
  if (fromEnv) return stripTrailingSlash(fromEnv);

  const origin = process.env.PUBLIC_RUNTIME_ORIGIN?.trim();
  if (!origin) {
    throw new Error(
      'PUBLIC_RUNTIME_ORIGIN or PAYFAST_NOTIFY_URL must be set — refusing localhost ITN default',
    );
  }
  return `${stripTrailingSlash(origin)}/payments/payfast/notify`;
}

export function assertNotifyUrlAllowedForEnvironment(
  notifyUrl: string,
  environment: 'sandbox' | 'production',
): void {
  let parsed: URL;
  try {
    parsed = new URL(notifyUrl);
  } catch {
    throw new Error(`Invalid payment notify URL: ${notifyUrl}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Payment notify URL must be http(s): ${notifyUrl}`);
  }

  if (environment === 'production') {
    if (parsed.protocol !== 'https:') {
      throw new Error('Production payment notify URL must use HTTPS');
    }
    if (isPrivateOrLocalHostname(parsed.hostname)) {
      throw new Error(
        'Production payment notify URL must not target localhost or a private network',
      );
    }
  }
}
