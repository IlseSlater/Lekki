/**
 * Pilot POS webhook → LEOS appendExternalLine params.
 * Pure adapter — no Nest, no Prisma, no Socket.IO.
 *
 * MVP stub: accepts a documented dummy JSON shape so we can prove ingress
 * before a real Pilot API contract exists.
 */

export type AppendExternalLineParams = {
  sessionId: string;
  externalRef: string;
  externalCheckId: string;
  catalogueItemId: string | null;
  labelFallback: string;
  quantity: number;
  unitPrice: number;
  origin: 'staff_pos';
};

export function translatePilotLineWebhook(body: unknown): AppendExternalLineParams {
  const raw = (body ?? {}) as Record<string, unknown>;
  const lineId = String(raw['lineId'] ?? '').trim();
  const checkId = String(raw['checkId'] ?? '').trim();
  const sessionId = String(raw['sessionId'] ?? '').trim();
  const label = String(raw['label'] ?? '').trim();
  const quantity = Number(raw['quantity']);
  const unitPrice = Number(raw['unitPrice']);
  const catalogueRaw = raw['catalogueItemId'];
  const catalogueItemId =
    typeof catalogueRaw === 'string' && catalogueRaw.trim()
      ? catalogueRaw.trim()
      : null;

  return {
    sessionId,
    externalRef: lineId,
    externalCheckId: checkId,
    catalogueItemId,
    labelFallback: label,
    quantity,
    unitPrice,
    origin: 'staff_pos',
  };
}

export {
  assertPilotWebhookAuthorized,
  timingSafeEqualText,
  verifyPilotWebhookHmac,
  verifyPilotWebhookToken,
} from './webhook-auth';
