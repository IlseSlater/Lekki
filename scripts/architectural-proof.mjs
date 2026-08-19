/**
 * Phase 1 Architectural Proof — automated checks (no DB required for package layer).
 */
import assert from 'node:assert/strict';
import { ProfileEngine, InMemoryProfileStore } from '@lekki/profile-engine';
import {
  registerRestaurantPack,
  restaurantProfile,
  cafeProfile,
} from '@lekki/pack-restaurant';
import { EntryRuntime } from '@lekki/runtime-entry';
import { ContextRuntime } from '@lekki/runtime-context';
import { CapabilityRuntime } from '@lekki/runtime-capability';
import {
  createManualPaymentBinding,
  createFakePaymentBinding,
  createDefaultFulfilmentBinding,
} from '@lekki/connector-manual-payment';
import { createPayFastPaymentBinding } from '@lekki/connector-payfast';

async function run() {
  const store = new InMemoryProfileStore();
  registerRestaurantPack(store);
  const engine = new ProfileEngine(store);

  const cafeCap = await engine.resolveCapability(
    { profileId: cafeProfile.id, version: cafeProfile.version },
    'payment.settle',
  );
  assert.equal(cafeCap.ok, true);

  const entry = new EntryRuntime({
    async findByToken(token) {
      if (token === 'qr-demo-restaurant') {
        return {
          token,
          organisationId: 'org_demo',
          venueId: 'ven_demo',
          physicalContextId: 'ctx_demo',
          profileId: restaurantProfile.id,
          profileVersion: restaurantProfile.version,
          active: true,
        };
      }
      return null;
    },
  });

  const resolved = await entry.resolve({ token: 'qr-demo-restaurant', entryMethod: 'qr' });
  assert.equal(resolved.ok, true);

  const contextRuntime = new ContextRuntime(
    {
      async findById(id) {
        return {
          id,
          organisationId: 'org_demo',
          venueId: 'ven_demo',
          code: 'T1',
          type: 'TABLE',
        };
      },
    },
    engine,
  );

  if (!resolved.ok) throw new Error('entry failed');
  const context = await contextRuntime.resolve(resolved.value);
  assert.equal(context.ok, true);

  const capability = new CapabilityRuntime(engine);
  capability.registerPaymentConnector(createManualPaymentBinding(10));
  capability.registerPaymentConnector(createFakePaymentBinding(5));
  capability.registerFulfilmentConnector(createDefaultFulfilmentBinding(10));

  const manual = await capability.resolvePaymentConnector({
    profileId: restaurantProfile.id,
    version: restaurantProfile.version,
  });
  assert.equal(manual.ok, true);
  if (manual.ok) {
    assert.equal(manual.value.connectorId, 'connector-fake-payment');
  }

  const fulfilment = await capability.resolveFulfilmentConnector({
    profileId: restaurantProfile.id,
    version: restaurantProfile.version,
  });
  assert.equal(fulfilment.ok, true);

  // Phase 2: PayFast binding swap — register only PayFast, no pack/core changes.
  const payfastRuntime = new CapabilityRuntime(engine);
  payfastRuntime.registerPaymentConnector(
    createPayFastPaymentBinding(
      {
        confirmWithServer: false,
        returnUrl: 'http://localhost:4200/guest?payment=return',
        cancelUrl: 'http://localhost:4200/guest?payment=cancel',
        notifyUrl: 'http://localhost:3000/payments/payfast/notify',
      },
      10,
    ),
  );
  const payfast = await payfastRuntime.resolvePaymentConnector({
    profileId: restaurantProfile.id,
    version: restaurantProfile.version,
  });
  assert.equal(payfast.ok, true);
  if (payfast.ok) {
    assert.equal(payfast.value.connectorId, 'connector-payfast');
    const attempt = await payfast.value.createPayment({
      transactionId: 'tx_proof',
      amount: 25,
      currency: 'ZAR',
      organisationId: 'org_demo',
      sessionId: 'ses_demo',
    });
    assert.equal(attempt.checkout?.method, 'form_post');
    assert.ok(attempt.checkout?.fields.signature);
    assert.equal(attempt.checkout?.fields.amount, '25.00');
  }

  // replacePaymentConnector keeps a single active binding
  payfastRuntime.replacePaymentConnector(createManualPaymentBinding(10));
  const afterReplace = await payfastRuntime.resolvePaymentConnector({
    profileId: restaurantProfile.id,
    version: restaurantProfile.version,
  });
  assert.equal(afterReplace.ok, true);
  if (afterReplace.ok) {
    assert.equal(afterReplace.value.connectorId, 'connector-manual-payment');
  }

  console.log('Architectural proof checks passed.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
