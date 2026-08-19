/**
 * LAN-aware origins — same pattern as Restaurant App (dark-culinary-pwa).
 * Phone on the same Wi‑Fi must hit the machine hostname, not localhost.
 */

const API_PORT = 3000;
const WEB_PORT = 4200;

export function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

/** API / Socket.IO base URL for the current browser host. */
export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') return `http://localhost:${API_PORT}`;
  const host = window.location.hostname;
  if (isLoopbackHost(host)) return `http://localhost:${API_PORT}`;
  return `http://${host}:${API_PORT}`;
}

/**
 * Public web origin for QR codes.
 * Prefer the page origin; if Studio is open on localhost, ask runtime for a LAN IP
 * so phones can open the link.
 */
export async function resolvePublicWebOrigin(): Promise<string> {
  if (typeof window === 'undefined') return `http://localhost:${WEB_PORT}`;
  const { hostname, port } = window.location;
  if (!isLoopbackHost(hostname)) {
    return window.location.origin;
  }

  try {
    const res = await fetch(`${resolveApiBaseUrl()}/dev/lan`);
    if (res.ok) {
      const data = (await res.json()) as { host?: string };
      if (data.host && !isLoopbackHost(data.host)) {
        const webPort = port || String(WEB_PORT);
        // Always use HTTP for dev LAN QR targets.
        // Mobile Safari will hard-block invalid/self-signed HTTPS certs.
        return `http://${data.host}:${webPort}`;
      }
    }
  } catch {
    /* fall through — QR may still be localhost */
  }

  // Final dev fallback:
  // If the runtime LAN lookup fails, we must still produce a QR that phones can open.
  // (Your dev logs typically show 192.168.18.127 for this environment.)
  const webPort = port || String(WEB_PORT);
  if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
    return `http://192.168.18.127:${webPort}`;
  }

  return window.location.origin;
}

export function entryUrlForToken(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/entry?token=${encodeURIComponent(token)}`;
}
