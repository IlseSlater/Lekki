/**
 * The cart lives on the phone. A guest who loses signal, locks the screen, or reloads
 * finds the same cart and the same order key, so a retry sends the same order once.
 */
export interface CartStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoredCartLine {
  catalogueItemId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  routingTags: string[];
  choiceSummary?: string;
  specialRequest?: string;
  selections?: Record<string, string[]>;
  imageUrl?: string;
}

export interface StoredCart {
  lines: StoredCartLine[];
  /** Same key on every retry of this order. */
  orderKey: string;
  savedAt: number;
}

const PREFIX = 'leos.cart.';
/** A cart older than this belongs to a visit that is over. */
export const CART_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const MAX_LINES = 60;
const MAX_URL_LENGTH = 500;

export function cartKey(sessionId: string): string {
  return `${PREFIX}${sessionId}`;
}

/** Small images only: a link, never image data. */
export function smallImageUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  const value = url.trim();
  if (!value || value.length > MAX_URL_LENGTH) return undefined;
  if (/^data:/i.test(value)) return undefined;
  return /^(https?:\/\/|\/)/i.test(value) ? value : undefined;
}

export function newOrderKey(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function cleanLine(raw: unknown): StoredCartLine | null {
  if (!raw || typeof raw !== 'object') return null;
  const l = raw as Record<string, unknown>;
  if (typeof l['catalogueItemId'] !== 'string' || !l['catalogueItemId']) return null;
  const quantity = Number(l['quantity']);
  const unitPrice = Number(l['unitPrice']);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return null;
  return {
    catalogueItemId: l['catalogueItemId'],
    label: typeof l['label'] === 'string' ? l['label'] : 'Item',
    quantity,
    unitPrice,
    routingTags: Array.isArray(l['routingTags'])
      ? (l['routingTags'] as unknown[]).filter((t): t is string => typeof t === 'string')
      : [],
    choiceSummary: typeof l['choiceSummary'] === 'string' ? l['choiceSummary'] : undefined,
    specialRequest: typeof l['specialRequest'] === 'string' ? l['specialRequest'] : undefined,
    selections:
      l['selections'] && typeof l['selections'] === 'object'
        ? (l['selections'] as Record<string, string[]>)
        : undefined,
    imageUrl: smallImageUrl(l['imageUrl']),
  };
}

/** Writes the cart, or clears it when it is empty. Returns the stored text so callers can skip repeats. */
export function saveCart(
  storage: CartStorage,
  sessionId: string,
  lines: readonly StoredCartLine[],
  orderKey: string,
  now = Date.now(),
): string | null {
  if (!sessionId) return null;
  if (!lines.length) {
    storage.removeItem(cartKey(sessionId));
    return null;
  }
  const payload: StoredCart = {
    lines: lines.slice(0, MAX_LINES).map((l) => ({ ...l, imageUrl: smallImageUrl(l.imageUrl) })),
    orderKey,
    savedAt: now,
  };
  const text = JSON.stringify(payload);
  try {
    storage.setItem(cartKey(sessionId), text);
  } catch {
    // Storage full or blocked: the cart still works in memory.
    return null;
  }
  return text;
}

export function loadCart(
  storage: CartStorage,
  sessionId: string,
  now = Date.now(),
): StoredCart | null {
  if (!sessionId) return null;
  try {
    const raw = storage.getItem(cartKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCart>;
    if (typeof parsed.savedAt !== 'number' || now - parsed.savedAt > CART_MAX_AGE_MS) {
      storage.removeItem(cartKey(sessionId));
      return null;
    }
    const lines = (Array.isArray(parsed.lines) ? parsed.lines : [])
      .map(cleanLine)
      .filter((l): l is StoredCartLine => !!l)
      .slice(0, MAX_LINES);
    if (!lines.length) return null;
    return {
      lines,
      orderKey: typeof parsed.orderKey === 'string' && parsed.orderKey ? parsed.orderKey : newOrderKey(),
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export function clearCart(storage: CartStorage, sessionId: string): void {
  if (sessionId) storage.removeItem(cartKey(sessionId));
}
