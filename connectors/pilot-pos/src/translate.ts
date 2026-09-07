/**
 * Pilot POS webhook → normalized ingress payload.
 * Pure adapter — no Nest, no Prisma, no Socket.IO.
 *
 * sessionId and catalogueItemId are resolved in runtime via PosPlaceMapping /
 * PosSkuMapping — never trusted from the vendor payload.
 */

export type PilotIngressPayload = {
  /** Pilot line id — LEOS idempotency key (TransactionLine.externalRef). */
  externalRef: string;
  /** Pilot table/place code — resolved via PosPlaceMapping. */
  externalPlaceId: string;
  /** Pilot open-check id (falls back to place when Pilot only sends the table). */
  externalCheckId: string;
  /** Pilot SKU — resolved via PosSkuMapping; null when the punch has label only. */
  externalSkuId: string | null;
  labelFallback: string;
  quantity: number;
  unitPrice: number;
};

function readString(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

/**
 * Normalize a Pilot (or Pilot-shaped stub) webhook body.
 * Does not look up sessions or catalogue — runtime owns that.
 */
export function translatePilotLineWebhook(body: unknown): PilotIngressPayload {
  const raw = (body ?? {}) as Record<string, unknown>;
  const externalRef = readString(raw, 'lineId', 'externalRef');
  // Place: prefer explicit place/table fields; Pilot stubs may only send checkId = TBL-12.
  const externalPlaceId =
    readString(raw, 'placeId', 'tableId', 'externalPlaceId') ||
    readString(raw, 'checkId', 'externalCheckId');
  const externalCheckId =
    readString(raw, 'checkId', 'externalCheckId') || externalPlaceId;
  const externalSkuId = readString(raw, 'sku', 'skuId', 'externalSkuId') || null;
  const labelFallback = readString(raw, 'label', 'labelFallback', 'name');
  const quantity = Number(raw['quantity']);
  const unitPrice = Number(raw['unitPrice'] ?? raw['price']);

  return {
    externalRef,
    externalPlaceId,
    externalCheckId,
    externalSkuId,
    labelFallback,
    quantity,
    unitPrice,
  };
}
