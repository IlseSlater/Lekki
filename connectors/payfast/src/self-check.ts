import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  generateSignature,
  pfEncode,
  verifyItnSignature,
  PayFastPaymentConnector,
  formatPayFastAmount,
} from './index';

/** Mirror of PayFast PHP urlencode + md5 for a known fixture. */
function phpStyleSignature(data: Record<string, string>, passphrase?: string) {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val === '') continue;
    parts.push(`${key}=${pfEncode(val)}`);
  }
  let s = parts.join('&');
  if (passphrase) s += `&passphrase=${pfEncode(passphrase)}`;
  return createHash('md5').update(s).digest('hex');
}

async function run() {
  assert.equal(pfEncode('http://example.com/a b'), 'http%3A%2F%2Fexample.com%2Fa+b');
  assert.equal(formatPayFastAmount(10), '10.00');
  assert.equal(formatPayFastAmount(10.5), '10.50');

  const data = {
    merchant_id: '10000100',
    merchant_key: '46f0cd694581a',
    return_url: 'http://www.yourdomain.co.za/return.php',
    cancel_url: 'http://www.yourdomain.co.za/cancel.php',
    notify_url: 'http://www.yourdomain.co.za/notify.php',
    name_first: 'First Name',
    name_last: 'Last Name',
    email_address: 'test@test.com',
    m_payment_id: '1234',
    amount: '10.00',
    item_name: 'Order#123',
  };
  const passphrase = 'jt7NOE43FZPn';
  const sig = generateSignature(data, passphrase);
  assert.equal(sig, phpStyleSignature(data, passphrase));
  assert.equal(sig.length, 32);

  const connector = new PayFastPaymentConnector({
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

  const attempt = await connector.createPayment({
    transactionId: 'tx_demo' as never,
    amount: 99.5,
    currency: 'ZAR',
    organisationId: 'org_demo',
    sessionId: 'ses_demo',
  });

  assert.equal(attempt.status, 'pending');
  assert.ok(attempt.checkout);
  assert.equal(attempt.checkout?.method, 'form_post');
  assert.equal(attempt.checkout?.fields.amount, '99.50');
  assert.equal(attempt.checkout?.fields.m_payment_id, attempt.paymentId);
  assert.equal(
    attempt.checkout?.fields.signature,
    generateSignature(
      Object.fromEntries(
        Object.entries(attempt.checkout!.fields).filter(([k]) => k !== 'signature'),
      ),
      passphrase,
    ),
  );

  const itn: Record<string, string> = {
    m_payment_id: attempt.paymentId,
    pf_payment_id: 'pf_999',
    payment_status: 'COMPLETE',
    amount_gross: '99.50',
    merchant_id: '10000100',
  };
  itn.signature = generateSignature(itn, passphrase);
  assert.equal(verifyItnSignature(itn, passphrase), true);

  const handled = await connector.handleItn(itn, 99.5);
  assert.equal(handled.ok, true);
  assert.equal(handled.settlement, 'settled');

  const bad = await connector.handleItn({ ...itn, signature: 'deadbeef' }, 99.5);
  assert.equal(bad.ok, false);

  console.log('PayFast connector checks passed.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
