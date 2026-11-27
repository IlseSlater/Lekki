import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertBindablePaymentConnector,
  assertInstallablePaymentConnector,
  findPaymentConnectorDefinition,
  isInstallablePaymentConnector,
  listPaymentConnectorDefinitions,
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

  it('registers yoco beside payfast and keeps it closed until a real verify', async () => {
    const def = findPaymentConnectorDefinition('yoco');
    assert.ok(def);
    assert.equal(def.connectorId, 'connector-yoco');
    assert.equal(def.installable, false);
    assert.equal(def.bindable, false);
    assert.ok(def.capabilities.includes('PaymentCapability.CreatePayment'));
    assert.equal(isInstallablePaymentConnector('yoco'), false);
    assert.throws(() => assertBindablePaymentConnector('yoco'), /non-bindable/i);
    assert.throws(() => assertInstallablePaymentConnector('connector-yoco'), /not installable/i);
    const verified = await def.verify({
      organisationId: 'o',
      venueId: 'v',
      environment: 'sandbox',
      config: {},
      secrets: { secretKey: 'sk_test_x' },
    });
    assert.equal(verified.ok, false);
  });

  it('keeps payfast as the default gateway', () => {
    assert.equal(listPaymentConnectorDefinitions()[0]?.id, 'payfast');
    assert.equal(isInstallablePaymentConnector('payfast'), true);
  });

  it('allows fake only as bindable (env), not installable', () => {
    assert.equal(isInstallablePaymentConnector('fake'), false);
    assert.doesNotThrow(() => assertBindablePaymentConnector('fake'));
  });
});
