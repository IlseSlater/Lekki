import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PayFastPaymentConnector } from './index';

/**
 * PayFast shows every method enabled on the merchant when payment_method is omitted
 * (cards, Apple Pay, Google Pay, Samsung Pay, Capitec Pay, SnapScan, Zapper).
 * Setting ap, gp, or cp hides the others. Lekki never pins a method.
 */
describe('PayFast checkout methods', () => {
  it('leaves payment_method unset so the hosted page offers every enabled method', async () => {
    const connector = new PayFastPaymentConnector({
      merchantId: '10000100',
      baseUrl: 'https://sandbox.payfast.co.za/eng/process',
      validateUrl: 'https://sandbox.payfast.co.za/eng/query/validate',
      returnUrl: 'http://localhost:4200/guest?payment=return',
      cancelUrl: 'http://localhost:4200/guest?payment=cancel',
      notifyUrl: 'http://localhost:3000/payments/payfast/notify',
      confirmWithServer: false,
      resolveSecret: async (key) => (key === 'merchantKey' ? '46f0cd694581a' : 'jt7NOE43FZPn'),
    });
    const attempt = await connector.createPayment({
      transactionId: 'tx_demo' as never,
      amount: 120,
      currency: 'ZAR',
      organisationId: 'org_demo',
      sessionId: 'ses_demo',
    });
    const fields = attempt.checkout?.fields ?? {};
    assert.equal('payment_method' in fields, false);
    assert.equal(Object.keys(fields).some((k) => /method/i.test(k)), false);
  });
});
