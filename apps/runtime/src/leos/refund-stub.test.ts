import assert from 'node:assert/strict';
import test from 'node:test';
import type { PaymentId } from '@lekki/contracts';
import { ManualPaymentConnector } from '@lekki/connector-manual-payment';
import { PayFastPaymentConnector } from '@lekki/connector-payfast';

test('row 10: PayFast refund is an explicit stub — fails closed', async () => {
  const payfast = new PayFastPaymentConnector({
    merchantId: '10000100',
    baseUrl: 'https://example.test/process',
    validateUrl: 'https://example.test/validate',
    returnUrl: 'https://example.test/return',
    cancelUrl: 'https://example.test/cancel',
    notifyUrl: 'https://example.test/notify',
    merchantKey: 'test-key',
    passphrase: 'test-pass',
    confirmWithServer: false,
  });
  const result = await payfast.refundPayment('pay_stub' as PaymentId, 50);
  assert.equal(result.status, 'failed');
  assert.equal(result.refundedAmount, 0);
});

test('row 10: manual refund is in-process only — not a bank movement', async () => {
  const manual = new ManualPaymentConnector();
  const result = await manual.refundPayment('pay_stub' as PaymentId, 50);
  assert.equal(result.status, 'completed');
  assert.equal(result.refundedAmount, 50);
});
