/**
 * Refund path — manual connector refunds through CapabilityRuntime.
 * Run: node --import tsx src/leos/refund.self-check.ts
 */
import assert from 'node:assert/strict';
import { ProfileEngine, InMemoryProfileStore } from '@lekki/profile-engine';
import { registerRestaurantPack, restaurantProfile } from '@lekki/pack-restaurant';
import { CapabilityRuntime } from '@lekki/runtime-capability';
import { createManualPaymentBinding } from '@lekki/connector-manual-payment';
import { id } from '@lekki/contracts';

async function run() {
  const store = new InMemoryProfileStore();
  registerRestaurantPack(store);
  const engine = new ProfileEngine(store);
  const runtime = new CapabilityRuntime(engine);
  runtime.replacePaymentConnectorForTenant(
    { organisationId: 'org_demo', venueId: 'ven_demo' },
    createManualPaymentBinding(10),
  );

  const connector = await runtime.resolvePaymentConnector(
    { profileId: restaurantProfile.id, version: restaurantProfile.version },
    { organisationId: 'org_demo', venueId: 'ven_demo' },
  );
  assert.equal(connector.ok, true);
  if (!connector.ok) return;

  const attempt = await connector.value.createPayment({
    transactionId: id.transaction('tx_refund'),
    amount: 50,
    currency: 'ZAR',
    organisationId: 'org_demo',
    sessionId: 'sess_refund',
  });
  const refund = await connector.value.refundPayment(attempt.paymentId, 50);
  assert.equal(refund.status, 'completed');
  assert.equal(refund.refundedAmount, 50);
  console.log('refund.self-check: ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
