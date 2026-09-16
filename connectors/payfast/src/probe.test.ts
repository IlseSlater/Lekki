import assert from 'node:assert/strict';
import test from 'node:test';
import { generateApiSignature } from './api-signature';
import { payFastPingUrl, probeMerchantCredentials } from './probe';

test('API signature is alphabetical and passphrase-salted', () => {
  const sig = generateApiSignature(
    {
      version: 'v1',
      timestamp: '2020-02-01T12:00:01+02:00',
      'merchant-id': '10000100',
    },
    'jt7NOE43FZPn',
  );
  assert.equal(sig.length, 32);
  assert.match(sig, /^[a-f0-9]+$/);
  const sig2 = generateApiSignature(
    {
      'merchant-id': '10000100',
      timestamp: '2020-02-01T12:00:01+02:00',
      version: 'v1',
    },
    'jt7NOE43FZPn',
  );
  assert.equal(sig, sig2);
});

test('ping URL marks sandbox with testing=true', () => {
  assert.equal(payFastPingUrl('sandbox'), 'https://api.payfast.co.za/ping?testing=true');
  assert.equal(payFastPingUrl('production'), 'https://api.payfast.co.za/ping');
});

test('probe: missing passphrase fails closed without fetch', async () => {
  let called = false;
  const result = await probeMerchantCredentials({
    merchantId: '10000100',
    merchantKey: '46f0cd694581a',
    passphrase: '',
    environment: 'sandbox',
    fetchImpl: async () => {
      called = true;
      return new Response('nope', { status: 500 });
    },
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test('probe: HTTP 401 fails closed', async () => {
  const result = await probeMerchantCredentials({
    merchantId: '10000100',
    merchantKey: '46f0cd694581a',
    passphrase: 'jt7NOE43FZPn',
    environment: 'sandbox',
    fetchImpl: async () => new Response('Unauthorized', { status: 401 }),
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /Could not verify credentials/i);
  }
});

test('probe: 200 with PayFast API casing succeeds', async () => {
  const result = await probeMerchantCredentials({
    merchantId: '10000100',
    merchantKey: '46f0cd694581a',
    passphrase: 'jt7NOE43FZPn',
    environment: 'sandbox',
    fetchImpl: async () => new Response('"PayFast API"', { status: 200 }),
  });
  assert.equal(result.ok, true);
});

test('probe: 200 with exact API V1 body succeeds with honest status', async () => {
  const result = await probeMerchantCredentials({
    merchantId: '10000100',
    merchantKey: '46f0cd694581a',
    passphrase: 'jt7NOE43FZPn',
    environment: 'sandbox',
    fetchImpl: async () => new Response('"API V1"', { status: 200 }),
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.merchantStatus, 'Merchant ID + passphrase accepted by /ping');
    assert.match(result.businessName, /sandbox \/ping/i);
  }
});

test('probe: 200 JSON envelope with API V1 succeeds', async () => {
  const result = await probeMerchantCredentials({
    merchantId: '10000100',
    merchantKey: '46f0cd694581a',
    passphrase: 'jt7NOE43FZPn',
    environment: 'sandbox',
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          code: 200,
          status: 'success',
          data: { response: 'API V1' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
  });
  assert.equal(result.ok, true);
});

test('probe: 200 JSON envelope failed does not succeed', async () => {
  const result = await probeMerchantCredentials({
    merchantId: '10000100',
    merchantKey: '46f0cd694581a',
    passphrase: 'jt7NOE43FZPn',
    environment: 'sandbox',
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          code: 200,
          status: 'failed',
          data: { response: 'API V1' },
        }),
        { status: 200 },
      ),
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /Could not verify credentials/i);
  }
});

test('probe: 200 proxy interstitial containing "api" fails closed', async () => {
  const result = await probeMerchantCredentials({
    merchantId: '10000100',
    merchantKey: '46f0cd694581a',
    passphrase: 'jt7NOE43FZPn',
    environment: 'sandbox',
    fetchImpl: async () =>
      new Response('<html>Corporate API Gateway Login</html>', { status: 200 }),
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /Unexpected response/i);
  }
});
