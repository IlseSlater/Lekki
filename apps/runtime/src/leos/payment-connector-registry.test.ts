import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertBindablePaymentConnector,
  assertInstallablePaymentConnector,
  isInstallablePaymentConnector,
} from './payment-connector-registry';

describe('payment connector registry (P0-1)', () => {
  it('treats payfast and manual as installable', () => {
    assert.equal(isInstallablePaymentConnector('payfast'), true);
    assert.equal(isInstallablePaymentConnector('connector-payfast'), true);
    assert.equal(isInstallablePaymentConnector('manual'), true);
  });

  it('rejects stripe as installable and bindable', () => {
    assert.equal(isInstallablePaymentConnector('stripe'), false);
    assert.throws(() => assertInstallablePaymentConnector('stripe'), /not installable/i);
    assert.throws(() => assertBindablePaymentConnector('stripe'), /Unknown or non-bindable/i);
  });

  it('allows fake only as bindable (env), not installable', () => {
    assert.equal(isInstallablePaymentConnector('fake'), false);
    assert.doesNotThrow(() => assertBindablePaymentConnector('fake'));
  });
});
