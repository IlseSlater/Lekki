import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertRuntimeSecrets,
  FORBIDDEN_STAFF_TOKEN_SECRET,
  FORBIDDEN_VAULT_KEY,
  requireStaffTokenSecret,
  requireVaultKey,
} from './runtime-secrets';

const ok = {
  STAFF_TOKEN_SECRET: 'local-staff-token-not-the-published-default',
  LEKKI_VAULT_KEY: 'local-vault-key-not-the-published-default',
};

test('Batch 2: assertRuntimeSecrets accepts non-default secrets', () => {
  assert.doesNotThrow(() => assertRuntimeSecrets(ok));
});

test('Batch 2: refuses unset STAFF_TOKEN_SECRET', () => {
  assert.throws(
    () =>
      assertRuntimeSecrets({
        STAFF_TOKEN_SECRET: '',
        LEKKI_VAULT_KEY: ok.LEKKI_VAULT_KEY,
      }),
    /STAFF_TOKEN_SECRET/,
  );
});

test('Batch 2: refuses published STAFF_TOKEN_SECRET default', () => {
  assert.throws(
    () =>
      assertRuntimeSecrets({
        STAFF_TOKEN_SECRET: FORBIDDEN_STAFF_TOKEN_SECRET,
        LEKKI_VAULT_KEY: ok.LEKKI_VAULT_KEY,
      }),
    /STAFF_TOKEN_SECRET/,
  );
});

test('Batch 2: refuses unset LEKKI_VAULT_KEY', () => {
  assert.throws(
    () =>
      assertRuntimeSecrets({
        STAFF_TOKEN_SECRET: ok.STAFF_TOKEN_SECRET,
        LEKKI_VAULT_KEY: undefined,
      }),
    /LEKKI_VAULT_KEY/,
  );
});

test('Batch 2: refuses published LEKKI_VAULT_KEY default', () => {
  assert.throws(
    () =>
      assertRuntimeSecrets({
        STAFF_TOKEN_SECRET: ok.STAFF_TOKEN_SECRET,
        LEKKI_VAULT_KEY: FORBIDDEN_VAULT_KEY,
      }),
    /LEKKI_VAULT_KEY/,
  );
});

test('Batch 2: require helpers return the configured value', () => {
  assert.equal(requireStaffTokenSecret(ok), ok.STAFF_TOKEN_SECRET);
  assert.equal(requireVaultKey(ok), ok.LEKKI_VAULT_KEY);
});
