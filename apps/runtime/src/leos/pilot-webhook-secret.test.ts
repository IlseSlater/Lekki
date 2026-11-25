import assert from 'node:assert/strict';
import test from 'node:test';
import { choosePilotWebhookSecretSource } from './pilot-webhook-secret';

test('Pilot secret: venue with an active vaulted secret uses only that secret', () => {
  assert.deepEqual(
    choosePilotWebhookSecretSource({
      install: { webhookSecretRef: 'vault_ref_1', status: 'active' },
      nodeEnv: 'production',
    }),
    { kind: 'vault', secretRef: 'vault_ref_1' },
  );
});

test('Pilot secret: inactive install never falls back to the shared env secret', () => {
  for (const nodeEnv of ['production', 'development', undefined]) {
    assert.deepEqual(
      choosePilotWebhookSecretSource({
        install: { webhookSecretRef: 'vault_ref_1', status: 'draft' },
        nodeEnv,
      }),
      { kind: 'reject', reason: 'pilot_install_not_active' },
    );
  }
});

test('Pilot secret: shared env secret is dev-only', () => {
  assert.deepEqual(choosePilotWebhookSecretSource({ install: null, nodeEnv: 'development' }), {
    kind: 'env',
  });
  assert.deepEqual(choosePilotWebhookSecretSource({ install: null, nodeEnv: 'production' }), {
    kind: 'reject',
    reason: 'no_venue_webhook_secret',
  });
});
