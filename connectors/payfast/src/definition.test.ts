import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { payFastConnectorDefinition } from './definition';

describe('PayFast PaymentConnectorDefinition', () => {
  it('declares public + secret credentials without PayFast columns', () => {
    const ids = payFastConnectorDefinition.credentials.map((c) => c.id);
    assert.deepEqual(ids, ['merchantId', 'merchantKey', 'passphrase']);
    assert.equal(
      payFastConnectorDefinition.credentials.find((c) => c.id === 'merchantId')?.secret,
      false,
    );
    assert.equal(
      payFastConnectorDefinition.credentials.find((c) => c.id === 'merchantKey')?.secret,
      true,
    );
    assert.equal(payFastConnectorDefinition.webhook?.requiresPublicOrigin, true);
    assert.equal(payFastConnectorDefinition.installable, true);
  });

  it('createBinding fails closed without merchantId', () => {
    assert.throws(
      () =>
        payFastConnectorDefinition.createBinding({
          organisationId: 'org_x',
          venueId: 'ven_x',
          environment: 'sandbox',
          config: {},
          vaultRefs: {},
          resolveSecret: async () => undefined,
        }),
      /merchant ID/i,
    );
  });
});
