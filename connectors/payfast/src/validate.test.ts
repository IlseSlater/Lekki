import assert from 'node:assert/strict';
import test from 'node:test';
import { confirmItnWithPayFast } from './validate';

const payload = {
  m_payment_id: 'pay_test',
  payment_status: 'COMPLETE',
  amount_gross: '57.00',
  signature: 'abc',
};

test('confirmItnWithPayFast posts URL-encoded form, never JSON', async () => {
  let captured: RequestInit | undefined;
  const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
    captured = init;
    return new Response('VALID', { status: 200 });
  }) as typeof fetch;

  const ok = await confirmItnWithPayFast(
    payload,
    'https://sandbox.payfast.co.za/eng/query/validate',
    fetchImpl,
  );
  assert.equal(ok, true);
  assert.equal(
    (captured?.headers as Record<string, string>)['Content-Type'],
    'application/x-www-form-urlencoded',
  );
  assert.equal((captured?.headers as Record<string, string>)['User-Agent'], 'Lekki-Server/1.0');
  assert.equal(typeof captured?.body, 'string');
  assert.equal((captured?.body as string).includes('"m_payment_id"'), false);
  assert.match(captured?.body as string, /m_payment_id=pay_test/);
  assert.match(captured?.body as string, /amount_gross=57.00/);
});

test('confirmItnWithPayFast fail-closes on network error (does not throw)', async () => {
  const fetchImpl = (async () => {
    throw new TypeError('fetch failed');
  }) as typeof fetch;

  const ok = await confirmItnWithPayFast(
    payload,
    'https://sandbox.payfast.co.za/eng/query/validate',
    fetchImpl,
    200,
  );
  assert.equal(ok, false);
});

test('confirmItnWithPayFast fail-closes when the validate call hangs until abort', async () => {
  const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
    await new Promise<void>((_, reject) => {
      const signal = init?.signal;
      if (!signal) return;
      if (signal.aborted) {
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        return;
      }
      signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
      });
    });
    return new Response('VALID', { status: 200 });
  }) as typeof fetch;

  const started = Date.now();
  const ok = await confirmItnWithPayFast(
    payload,
    'https://sandbox.payfast.co.za/eng/query/validate',
    fetchImpl,
    80,
  );
  const elapsed = Date.now() - started;
  assert.equal(ok, false);
  assert.ok(elapsed < 1500, `hung fetch leaked (${elapsed}ms)`);
});
