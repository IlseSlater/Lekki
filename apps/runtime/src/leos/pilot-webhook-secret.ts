/**
 * Which secret authorises a Pilot webhook for a venue — pure, no Prisma.
 *
 * A venue that has its own vaulted secret must use only that secret: the shared
 * env secret would let anyone holding it post lines into any venue. The env
 * secret is a dev / demo convenience and is never accepted in production.
 */

export type PilotSecretSource =
  | { kind: 'vault'; secretRef: string }
  | { kind: 'env' }
  | { kind: 'reject'; reason: 'pilot_install_not_active' | 'no_venue_webhook_secret' };

export function choosePilotWebhookSecretSource(input: {
  install: { webhookSecretRef: string | null; status: string } | null;
  nodeEnv?: string;
}): PilotSecretSource {
  const ref = input.install?.webhookSecretRef?.trim();
  if (ref) {
    if (input.install?.status === 'active') return { kind: 'vault', secretRef: ref };
    return { kind: 'reject', reason: 'pilot_install_not_active' };
  }
  if (input.nodeEnv === 'production') {
    return { kind: 'reject', reason: 'no_venue_webhook_secret' };
  }
  return { kind: 'env' };
}
