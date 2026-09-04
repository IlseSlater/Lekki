/**
 * Runtime shared secrets — fail closed. A published default is as bad as unset:
 * anyone who has read the repo can forge a staff token or decrypt the vault.
 */

export const FORBIDDEN_STAFF_TOKEN_SECRET = 'leos-dev-staff-token-secret';
export const FORBIDDEN_VAULT_KEY = 'lekki-dev-vault-key';

export type RuntimeSecretEnv = {
  STAFF_TOKEN_SECRET?: string;
  LEKKI_VAULT_KEY?: string;
};

function readStaff(env: RuntimeSecretEnv): string {
  return env.STAFF_TOKEN_SECRET?.trim() ?? '';
}

function readVault(env: RuntimeSecretEnv): string {
  return env.LEKKI_VAULT_KEY?.trim() ?? '';
}

export function assertRuntimeSecrets(env: RuntimeSecretEnv): void {
  requireStaffTokenSecret(env);
  requireVaultKey(env);
}

export function requireStaffTokenSecret(
  env: RuntimeSecretEnv = process.env,
): string {
  const staff = readStaff(env);
  if (!staff || staff === FORBIDDEN_STAFF_TOKEN_SECRET) {
    throw new Error(
      'STAFF_TOKEN_SECRET must be set to a non-default value (see .env.example)',
    );
  }
  return staff;
}

export function requireVaultKey(env: RuntimeSecretEnv = process.env): string {
  const vault = readVault(env);
  if (!vault || vault === FORBIDDEN_VAULT_KEY) {
    throw new Error(
      'LEKKI_VAULT_KEY must be set to a non-default value (see .env.example)',
    );
  }
  return vault;
}
