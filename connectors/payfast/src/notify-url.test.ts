import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertNotifyUrlAllowedForEnvironment,
  isPrivateOrLocalHostname,
  resolvePayFastNotifyUrl,
} from './notify-url';

describe('PayFast notify URL (P0-3)', () => {
  it('refuses silent localhost default when env unset', () => {
    const prevNotify = process.env.PAYFAST_NOTIFY_URL;
    const prevOrigin = process.env.PUBLIC_RUNTIME_ORIGIN;
    delete process.env.PAYFAST_NOTIFY_URL;
    delete process.env.PUBLIC_RUNTIME_ORIGIN;
    try {
      assert.throws(() => resolvePayFastNotifyUrl(), /PUBLIC_RUNTIME_ORIGIN or PAYFAST_NOTIFY_URL/i);
    } finally {
      if (prevNotify !== undefined) process.env.PAYFAST_NOTIFY_URL = prevNotify;
      else delete process.env.PAYFAST_NOTIFY_URL;
      if (prevOrigin !== undefined) process.env.PUBLIC_RUNTIME_ORIGIN = prevOrigin;
      else delete process.env.PUBLIC_RUNTIME_ORIGIN;
    }
  });

  it('derives notify URL from PUBLIC_RUNTIME_ORIGIN', () => {
    const prevNotify = process.env.PAYFAST_NOTIFY_URL;
    const prevOrigin = process.env.PUBLIC_RUNTIME_ORIGIN;
    delete process.env.PAYFAST_NOTIFY_URL;
    process.env.PUBLIC_RUNTIME_ORIGIN = 'https://runtime.example.test/';
    try {
      assert.equal(
        resolvePayFastNotifyUrl(),
        'https://runtime.example.test/payments/payfast/notify',
      );
    } finally {
      if (prevNotify !== undefined) process.env.PAYFAST_NOTIFY_URL = prevNotify;
      else delete process.env.PAYFAST_NOTIFY_URL;
      if (prevOrigin !== undefined) process.env.PUBLIC_RUNTIME_ORIGIN = prevOrigin;
      else delete process.env.PUBLIC_RUNTIME_ORIGIN;
    }
  });

  it('blocks production notify on localhost / private ranges', () => {
    assert.equal(isPrivateOrLocalHostname('localhost'), true);
    assert.equal(isPrivateOrLocalHostname('192.168.1.10'), true);
    assert.throws(
      () =>
        assertNotifyUrlAllowedForEnvironment(
          'http://localhost:3000/payments/payfast/notify',
          'production',
        ),
      /HTTPS|localhost|private/i,
    );
    assert.throws(
      () =>
        assertNotifyUrlAllowedForEnvironment(
          'https://10.0.0.8/payments/payfast/notify',
          'production',
        ),
      /private|localhost/i,
    );
    assert.doesNotThrow(() =>
      assertNotifyUrlAllowedForEnvironment(
        'https://pay.example.test/payments/payfast/notify',
        'production',
      ),
    );
  });
});
