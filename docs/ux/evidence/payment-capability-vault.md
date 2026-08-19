# Evidence — PaymentCapability vault

**Proof:** Payment connector secrets now cross a vault boundary instead of living in active connector config or setup install rows.  
**Date:** 2026-08-12  
**Surfaces:** Setup payments runtime · payment connector bootstrap · PayFast connector · Prisma vault models  
**Pillar:** Confidence · Trust · Platform safety · LEK-040 invisibility

## What shipped

| Boundary | Proof |
|----------|-------|
| Encrypted storage | `SecretsVaultEntry` stores AES-256-GCM ciphertext, IV, auth tag, and opaque `secretRef` |
| Immutable audit | `SecretsVaultAudit` records write / read / verify actions without storing secret values |
| Setup capture | `setup-payments.service.ts` stores `merchantKey` / `passphrase` through `SecretsVaultService` and saves only secret refs on installs |
| Bootstrap handoff | `PaymentConnectorInstall` activates with `merchantKeySecretRef` / `passphraseSecretRef`, not plaintext |
| JIT runtime use | PayFast resolves secrets only inside `createPayment()` and ITN verification |
| Webhook trust | ITN signature verification uses the same vault-backed secret boundary before settlement events |

## Human rule

The merchant still experiences a calm “How guests pay” moment.

The human never sees:

- vault
- SecureString
- connector secret references
- tenant isolation mechanics

## Transitional note

Legacy plaintext columns remain in the schema temporarily to avoid destructive migration on existing rows.

New setup writes scrub those fields to `null` and move active runtime behavior onto vault refs.

## Verify

1. `pnpm --filter @lekki/connector-payfast test`
2. `pnpm --filter @lekki/runtime-app test:vault`
3. `pnpm --filter @lekki/runtime-app build`
4. `GET /health` returns runtime + database `ok`

## Explicitly not

- New payment platform
- Setup redesign
- Marketplace / connector distribution
- Guest-visible payment complexity
