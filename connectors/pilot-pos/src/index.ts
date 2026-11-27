/**
 * Pilot POS webhook → LEOS ingress types + auth.
 * Pure package — no Nest, no Prisma, no Socket.IO.
 */

export type { PilotIngressPayload } from './translate';
export { translatePilotLineWebhook } from './translate';

export {
  assertPilotWebhookAuthorized,
  timingSafeEqualText,
  verifyPilotWebhookHmac,
  verifyPilotWebhookToken,
} from './webhook-auth';

export type { PilotTender, PilotTenderReadiness } from './tender';
export { PilotTenderUnavailableError, pilotTenderReadiness, postPilotTender } from './tender';
