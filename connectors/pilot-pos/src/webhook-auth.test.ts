import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import {
  assertPilotWebhookAuthorized,
  verifyPilotWebhookHmac,
  verifyPilotWebhookToken,
} from './webhook-auth';

test('Pilot webhook: bearer token matches (timing-safe)', () => {
  assert.equal(verifyPilotWebhookToken('Bearer secret-abc', 'secret-abc'), true);
  assert.equal(verifyPilotWebhookToken('secret-abc', 'secret-abc'), true);
  assert.equal(verifyPilotWebhookToken('Bearer wrong', 'secret-abc'), false);
  assert.equal(verifyPilotWebhookToken('', 'secret-abc'), false);
});

test('Pilot webhook: HMAC-SHA256 of raw body', () => {
  const body = '{"lineId":"PILOT-1"}';
  const secret = 'hook-secret';
  const sig = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  assert.equal(verifyPilotWebhookHmac(body, sig, secret), true);
  assert.equal(verifyPilotWebhookHmac(body, `sha256=${sig}`, secret), true);
  assert.equal(verifyPilotWebhookHmac(body, 'deadbeef', secret), false);
});

test('Pilot webhook: assert fails closed without valid auth', () => {
  assert.throws(
    () =>
      assertPilotWebhookAuthorized({
        secret: 's',
        bearerOrTokenHeader: 'nope',
      }),
    (err: unknown) =>
      err instanceof Error && err.name === 'PilotWebhookUnauthorizedError',
  );
  assert.doesNotThrow(() =>
    assertPilotWebhookAuthorized({
      secret: 's',
      bearerOrTokenHeader: 'Bearer s',
    }),
  );
});
