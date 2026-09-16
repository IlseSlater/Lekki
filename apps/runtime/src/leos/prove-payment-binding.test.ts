import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LeosBootstrapService } from './leos-bootstrap.service';

describe('provePaymentBinding resolves vault secrets', () => {
  it('fails closed when a required vault ref cannot be decrypted', async () => {
    process.env.PUBLIC_RUNTIME_ORIGIN = 'https://runtime.example.test';
    const vault = {
      async resolveSecret() {
        return undefined;
      },
    };
    const bootstrap = Object.create(LeosBootstrapService.prototype) as LeosBootstrapService;
    Object.assign(bootstrap, {
      vault,
      capabilityRuntime: {
        replacePaymentConnector() {},
        replacePaymentConnectorForTenant() {},
        peekPaymentConnectorId() {
          return undefined;
        },
      },
    });

    await assert.rejects(
      () =>
        bootstrap.provePaymentBinding({
          organisationId: 'org_a',
          venueId: 'ven_a',
          connectorId: 'payfast',
          environment: 'sandbox',
          config: { merchantId: '10000100' },
          vaultRefs: { merchantKey: 'svr_dangling', passphrase: 'svr_dangling_pp' },
        }),
      (err: unknown) =>
        err instanceof Error && /could not be resolved from vault/i.test(err.message),
    );
  });

  it('provePaymentBinding is async (returns a Thenable)', () => {
    process.env.PUBLIC_RUNTIME_ORIGIN = 'https://runtime.example.test';
    const vault = {
      async resolveSecret() {
        return 'plaintext-ok';
      },
    };
    const bootstrap = Object.create(LeosBootstrapService.prototype) as LeosBootstrapService;
    Object.assign(bootstrap, { vault });
    const result = bootstrap.provePaymentBinding({
      organisationId: 'org_a',
      venueId: 'ven_a',
      connectorId: 'payfast',
      environment: 'sandbox',
      config: { merchantId: '10000100' },
      vaultRefs: { merchantKey: 'svr_k', passphrase: 'svr_p' },
    });
    assert.equal(typeof (result as Promise<unknown>).then, 'function');
  });
});
