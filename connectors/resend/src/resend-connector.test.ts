import assert from 'node:assert/strict';
import test from 'node:test';
import { ResendEmailConnector } from './resend-connector';

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

test('send() resolves the API key lazily, not at construction', async () => {
  let resolved = false;
  const connector = new ResendEmailConnector({
    resolveApiKey: async () => {
      resolved = true;
      return 're_test_key';
    },
    fromAddress: 'studio@lekki.app',
    fetchImpl: fakeFetch(200, { id: 'msg_123' }),
  });
  assert.equal(resolved, false);
  const result = await connector.send({ to: 'owner@venue.com', subject: 'Hi', text: 'Body' });
  assert.equal(resolved, true);
  assert.equal(result.ok, true);
  assert.equal(result.providerMessageId, 'msg_123');
});

test('missing API key fails calmly, never throws', async () => {
  const connector = new ResendEmailConnector({
    resolveApiKey: async () => undefined,
    fromAddress: 'studio@lekki.app',
  });
  const result = await connector.send({ to: 'owner@venue.com', subject: 'Hi' });
  assert.equal(result.ok, false);
  assert.match(result.reason ?? '', /could not be resolved/i);
});

test('non-2xx response surfaces the status, not a throw', async () => {
  const connector = new ResendEmailConnector({
    resolveApiKey: async () => 're_test_key',
    fromAddress: 'studio@lekki.app',
    fetchImpl: fakeFetch(422, { message: 'invalid from address' }),
  });
  const result = await connector.send({ to: 'owner@venue.com', subject: 'Hi' });
  assert.equal(result.ok, false);
  assert.match(result.reason ?? '', /422/);
});

test('network failure is caught, not thrown', async () => {
  const connector = new ResendEmailConnector({
    resolveApiKey: async () => 're_test_key',
    fromAddress: 'studio@lekki.app',
    fetchImpl: (async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch,
  });
  const result = await connector.send({ to: 'owner@venue.com', subject: 'Hi' });
  assert.equal(result.ok, false);
  assert.match(result.reason ?? '', /could not reach resend/i);
});
