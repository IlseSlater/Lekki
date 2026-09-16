import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CapabilityRuntime,
  paymentTenantKey,
} from './index';

class StubProfiles {
  async resolveCapability() {
    return { ok: true as const, value: true };
  }
}

test('venue PayFast binding beats global PAYMENT_CONNECTOR manual', async () => {
  const runtime = new CapabilityRuntime(new StubProfiles() as never);
  runtime.registerPaymentConnector({
    connectorId: 'connector-manual-payment',
    capability: { connectorId: 'connector-manual-payment' } as never,
    priority: 10,
  });
  runtime.replacePaymentConnectorForTenant(
    { organisationId: 'org_a', venueId: 'ven_a' },
    {
      connectorId: 'connector-payfast',
      capability: { connectorId: 'connector-payfast' } as never,
      priority: 10,
    },
  );

  const venue = await runtime.resolvePaymentConnector(
    { profileId: 'prf', version: '1' },
    { organisationId: 'org_a', venueId: 'ven_a' },
  );
  assert.equal(venue.ok, true);
  if (venue.ok) assert.equal(venue.value.connectorId, 'connector-payfast');

  const other = await runtime.resolvePaymentConnector(
    { profileId: 'prf', version: '1' },
    { organisationId: 'org_b', venueId: 'ven_b' },
  );
  assert.equal(other.ok, true);
  if (other.ok) assert.equal(other.value.connectorId, 'connector-manual-payment');

  assert.equal(
    paymentTenantKey({ organisationId: 'org_a', venueId: 'ven_a' }),
    'org_a:ven_a',
  );
});
