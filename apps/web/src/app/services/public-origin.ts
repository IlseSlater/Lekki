/**
 * LAN-aware origins — same pattern as Restaurant App (dark-culinary-pwa).
 * Phone on the same Wi‑Fi must hit the machine hostname, not localhost.
 *
 * Production: prefer injected PUBLIC_API_ORIGIN / same-origin HTTPS.
 * Never force http://host:3000 on a deployed HTTPS page (mixed content).
 */

const API_PORT = 3000;
const WEB_PORT = 4200;

declare global {
  interface Window {
    __LEOS_CONFIG__?: {
      apiOrigin?: string;
      webOrigin?: string;
    };
  }
}

export function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

function injectedApiOrigin(): string {
  if (typeof window === 'undefined') return '';
  const fromWindow = window.__LEOS_CONFIG__?.apiOrigin?.trim();
  if (fromWindow) return fromWindow.replace(/\/$/, '');
  const meta = document
    .querySelector('meta[name="leos-api-origin"]')
    ?.getAttribute('content')
    ?.trim();
  return meta ? meta.replace(/\/$/, '') : '';
}

function injectedWebOrigin(): string {
  if (typeof window === 'undefined') return '';
  const fromWindow = window.__LEOS_CONFIG__?.webOrigin?.trim();
  if (fromWindow) return fromWindow.replace(/\/$/, '');
  const meta = document
    .querySelector('meta[name="leos-web-origin"]')
    ?.getAttribute('content')
    ?.trim();
  return meta ? meta.replace(/\/$/, '') : '';
}

/** True when the page is served from Angular dev (:4200) or loopback. */
function isDevWebHost(): boolean {
  if (typeof window === 'undefined') return true;
  const { hostname, port, protocol } = window.location;
  if (isLoopbackHost(hostname)) return true;
  if (port === String(WEB_PORT) || port === '4200') return true;
  // file: or unexpected — treat as dev-style
  if (protocol === 'file:') return true;
  return false;
}

/** API / Socket.IO base URL for the current browser host. */
export function resolveApiBaseUrl(): string {
  const injected = injectedApiOrigin();
  if (injected) return injected;
  if (typeof window === 'undefined') return `http://localhost:${API_PORT}`;
  if (isDevWebHost()) {
    const host = window.location.hostname;
    if (isLoopbackHost(host)) return `http://localhost:${API_PORT}`;
    return `http://${host}:${API_PORT}`;
  }
  // Deployed: same origin (single Container App / reverse proxy).
  return window.location.origin;
}

/**
 * Public web origin for QR codes.
 * Prefer injected PUBLIC_WEB_ORIGIN, then page origin; localhost asks runtime for LAN IP.
 */
export async function resolvePublicWebOrigin(): Promise<string> {
  const injected = injectedWebOrigin();
  if (injected) return injected;
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
  const webPort = port || String(WEB_PORT);
  if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
    return `http://192.168.18.127:${webPort}`;
  }

  return window.location.origin;
}

export function entryUrlForToken(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/entry?token=${encodeURIComponent(token)}`;
}
