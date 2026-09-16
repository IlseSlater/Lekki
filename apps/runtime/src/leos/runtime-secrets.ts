/**
 * Runtime shared secrets — fail closed. A published default is as bad as unset:
 * anyone who has read the repo can forge a staff token or decrypt the vault.
 */

export const FORBIDDEN_STAFF_TOKEN_SECRET = 'leos-dev-staff-token-secret';
export const FORBIDDEN_VAULT_KEY = 'lekki-dev-vault-key';

export type RuntimeSecretEnv = {
  STAFF_TOKEN_SECRET?: string;
  LEKKI_VAULT_KEY?: string;
  PILOT_POS_WEBHOOK_SECRET?: string;
  NODE_ENV?: string;
  NODE_TLS_REJECT_UNAUTHORIZED?: string;
  PAYFAST_CONFIRM_WITH_SERVER?: string;
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
  assertProductionTlsNotDisabled(env);
  assertProductionPayFastConfirmEnabled(env);
}

/** Production must never disable TLS verification process-wide. */
export function assertProductionTlsNotDisabled(
  env: RuntimeSecretEnv = process.env,
): void {
  if (env.NODE_ENV !== 'production') return;
  if (env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    throw new Error(
      'NODE_TLS_REJECT_UNAUTHORIZED=0 is forbidden when NODE_ENV=production — use NODE_EXTRA_CA_CERTS',
    );
  }
}

/** Production must never skip PayFast server-side ITN validate. */
export function assertProductionPayFastConfirmEnabled(
  env: RuntimeSecretEnv = process.env,
): void {
  if (env.NODE_ENV !== 'production') return;
  if (env.PAYFAST_CONFIRM_WITH_SERVER === '0') {
    throw new Error(
      'PAYFAST_CONFIRM_WITH_SERVER=0 is forbidden when NODE_ENV=production',
    );
  }
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

/**
 * Shared secret for Pilot POS webhooks (Bearer or HMAC).
 * Required whenever the Pilot ingress endpoint is used — fail closed.
 */
export function requirePilotPosWebhookSecret(
  env: RuntimeSecretEnv = process.env,
): string {
  const secret = env.PILOT_POS_WEBHOOK_SECRET?.trim() ?? '';
  if (!secret || secret.length < 16) {
    throw new Error(
      'PILOT_POS_WEBHOOK_SECRET must be set to a strong value (16+ chars; see .env.example)',
    );
  }
  return secret;
}
