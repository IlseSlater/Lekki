import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PayFastPaymentConnector,
  checkItnAmountGross,
  generateSignature,
} from './index';

const passphrase = 'jt7NOE43FZPn';

function connector() {
  return new PayFastPaymentConnector({
    merchantId: '10000100',
    baseUrl: 'https://sandbox.payfast.co.za/eng/process',
    validateUrl: 'https://sandbox.payfast.co.za/eng/query/validate',
    returnUrl: 'http://localhost:4200/guest?payment=return',
    cancelUrl: 'http://localhost:4200/guest?payment=cancel',
    notifyUrl: 'http://localhost:3000/payments/payfast/notify',
    confirmWithServer: false,
    resolveSecret: async (secretKey) =>
      secretKey === 'merchantKey' ? '46f0cd694581a' : passphrase,
  });
}

test('checkItnAmountGross blocks underpay spoof (R500 expected, R1 ITN)', () => {
  const result = checkItnAmountGross(500, '1.00');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, 'underpay');
    assert.match(result.reason, /underpay spoof blocked/i);
  }
});

test('checkItnAmountGross refuses missing amount_gross', () => {
  const result = checkItnAmountGross(99.5, undefined);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'missing_gross');
});

test('checkItnAmountGross accepts exact match within 2dp', () => {
  const result = checkItnAmountGross(99.5, '99.50');
  assert.equal(result.ok, true);
});

test('handleItn: amount_gross underpay does not settle', async () => {
  const pf = connector();
  const attempt = await pf.createPayment({
    transactionId: 'tx_spoof' as never,
    amount: 500,
    currency: 'ZAR',
    organisationId: 'org_demo',
    sessionId: 'ses_demo',
  });

  const itn: Record<string, string> = {
    m_payment_id: attempt.paymentId,
    pf_payment_id: 'pf_spoof',
    payment_status: 'COMPLETE',
    amount_gross: '1.00',
    merchant_id: '10000100',
  };
  itn.signature = generateSignature(itn, passphrase);

  const handled = await pf.handleItn(itn, 500);
  assert.equal(handled.ok, false);
  assert.equal(handled.settlement, 'failed');
  assert.equal(handled.amountRejectCode, 'underpay');
  assert.notEqual(handled.settlement, 'settled');
});

test('handleItn: omit amount_gross refuses settlement', async () => {
  const pf = connector();
  const attempt = await pf.createPayment({
    transactionId: 'tx_nogross' as never,
    amount: 50,
    currency: 'ZAR',
    organisationId: 'org_demo',
    sessionId: 'ses_demo',
  });

  const itn: Record<string, string> = {
    m_payment_id: attempt.paymentId,
    pf_payment_id: 'pf_nogross',
    payment_status: 'COMPLETE',
    merchant_id: '10000100',
  };
  itn.signature = generateSignature(itn, passphrase);

  const handled = await pf.handleItn(itn, 50);
  assert.equal(handled.ok, false);
  assert.equal(handled.amountRejectCode, 'missing_gross');
});

test('handleItn: validate reject fails closed before settle', async () => {
  const pf = new PayFastPaymentConnector({
    merchantId: '10000100',
    baseUrl: 'https://sandbox.payfast.co.za/eng/process',
    validateUrl: 'https://sandbox.payfast.co.za/eng/query/validate',
    returnUrl: 'http://localhost:4200/guest?payment=return',
    cancelUrl: 'http://localhost:4200/guest?payment=cancel',
    notifyUrl: 'http://localhost:3000/payments/payfast/notify',
    confirmWithServer: true,
    fetchImpl: async () =>
      new Response('INVALID', { status: 200 }) as unknown as Response,
    resolveSecret: async (secretKey) =>
      secretKey === 'merchantKey' ? '46f0cd694581a' : passphrase,
  });

  const attempt = await pf.createPayment({
    transactionId: 'tx_val' as never,
    amount: 10,
    currency: 'ZAR',
    organisationId: 'org_demo',
    sessionId: 'ses_demo',
  });

  const itn: Record<string, string> = {
    m_payment_id: attempt.paymentId,
    pf_payment_id: 'pf_val',
    payment_status: 'COMPLETE',
    amount_gross: '10.00',
    merchant_id: '10000100',
  };
  itn.signature = generateSignature(itn, passphrase);

  const handled = await pf.handleItn(itn, 10);
  assert.equal(handled.ok, false);
  assert.match(handled.reason ?? '', /validate rejected/i);
  assert.equal(handled.settlement, 'pending');
});

test('handleItn: validate network failure fails closed and does not throw', async () => {
  const pf = new PayFastPaymentConnector({
    merchantId: '10000100',
    baseUrl: 'https://sandbox.payfast.co.za/eng/process',
    validateUrl: 'https://sandbox.payfast.co.za/eng/query/validate',
    returnUrl: 'http://localhost:4200/guest?payment=return',
    cancelUrl: 'http://localhost:4200/guest?payment=cancel',
    notifyUrl: 'http://localhost:3000/payments/payfast/notify',
    confirmWithServer: true,
    fetchImpl: async () => {
      throw new TypeError('fetch failed');
    },
    resolveSecret: async (secretKey) =>
      secretKey === 'merchantKey' ? '46f0cd694581a' : passphrase,
  });

  const attempt = await pf.createPayment({
    transactionId: 'tx_net' as never,
    amount: 57,
    currency: 'ZAR',
    organisationId: 'org_demo',
    sessionId: 'ses_demo',
  });

  const itn: Record<string, string> = {
    m_payment_id: attempt.paymentId,
    pf_payment_id: 'pf_net',
    payment_status: 'COMPLETE',
    amount_gross: '57.00',
    merchant_id: '10000100',
  };
  itn.signature = generateSignature(itn, passphrase);

  const handled = await pf.handleItn(itn, 57);
  assert.equal(handled.ok, false);
  assert.equal(handled.settlement, 'pending');
});
