import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { SecretsVaultService } from './secrets-vault.service';
import { SetupPaymentsService } from './setup-payments.service';

type InstallRow = Record<string, unknown> & {
  id: string;
  organisationId: string;
  venueId: string;
  connectorId: string;
  status: string;
  environment: string;
  verifiedEnvironment?: string | null;
  configJson?: Record<string, string>;
  vaultRefsJson?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
};

function createFakePrisma() {
  const entries: Array<Record<string, unknown>> = [];
  const audits: Array<Record<string, unknown>> = [];
  const installs: InstallRow[] = [];
  const venues = [{ id: 'ven_a', organisationId: 'org_a', createdAt: new Date('2026-01-01') }];

  const paymentConnectorInstall = {
    async findFirst(args?: { where?: Record<string, unknown> }) {
      const where = args?.where ?? {};
      const matched = installs.filter((row) =>
        Object.entries(where).every(([k, value]) => {
          if (k === 'NOT' && value && typeof value === 'object' && 'id' in value) {
            return row.id !== (value as { id: string }).id;
          }
          if (k === 'status' && value && typeof value === 'object' && 'in' in value) {
            return (value as { in: string[] }).in.includes(row.status);
          }
          return (row as Record<string, unknown>)[k] === value;
        }),
      );
      return matched.at(-1) ?? null;
    },
    async create(args: { data: Record<string, unknown> }) {
      const created: InstallRow = {
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as InstallRow;
      installs.push(created);
      return created;
    },
    async update(args: { where: { id: string }; data: Record<string, unknown> }) {
      const row = installs.find((install) => install.id === args.where.id);
      if (!row) throw new Error('Install not found');
      Object.assign(row, args.data, { updatedAt: new Date() });
      return row;
    },
    async updateMany(args: {
      where: { status?: string; organisationId?: string };
      data: Record<string, unknown>;
    }) {
      let count = 0;
      for (const row of installs) {
        if (args.where.status && row.status !== args.where.status) continue;
        if (args.where.organisationId && row.organisationId !== args.where.organisationId) {
          continue;
        }
        Object.assign(row, args.data, { updatedAt: new Date() });
        count += 1;
      }
      return { count };
    },
  };

  return {
    entries,
    audits,
    installs,
    secretsVaultEntry: {
      async upsert(args: {
        where: {
          organisationId_venueId_connectorId_secretKey: {
            organisationId: string;
            venueId: string;
            connectorId: string;
            secretKey: string;
          };
        };
        update: Record<string, unknown>;
        create: Record<string, unknown>;
      }) {
        const key = args.where.organisationId_venueId_connectorId_secretKey;
        const existing = entries.find(
          (row) =>
            row.organisationId === key.organisationId &&
            row.venueId === key.venueId &&
            row.connectorId === key.connectorId &&
            row.secretKey === key.secretKey,
        );
        if (existing) {
          Object.assign(existing, args.update, { updatedAt: new Date() });
          return existing;
        }
        const created = { ...args.create, createdAt: new Date(), updatedAt: new Date() };
        entries.push(created);
        return created;
      },
      async findFirst(args: { where: Record<string, unknown> }) {
        return (
          entries.find((row) =>
            Object.entries(args.where).every(([k, value]) => row[k] === value),
          ) ?? null
        );
      },
    },
    secretsVaultAudit: {
      async create(args: { data: Record<string, unknown> }) {
        audits.push({ ...args.data, createdAt: new Date() });
      },
    },
    paymentConnectorInstall,
    venue: {
      async findFirst(args?: { where?: { id?: string; organisationId?: string } }) {
        const where = args?.where ?? {};
        return (
          venues.find((v) => {
            if (where.id && v.id !== where.id) return false;
            if (where.organisationId && v.organisationId !== where.organisationId) return false;
            return true;
          }) ?? null
        );
      },
    },
    async $transaction(fn: (tx: { paymentConnectorInstall: typeof paymentConnectorInstall }) => Promise<unknown>) {
      return fn({ paymentConnectorInstall });
    },
  };
}

describe('activate prove-before-write + verifiedEnvironment (N1 + P1-5)', () => {
  it('refuses activate when verifiedEnvironment does not match environment', async () => {
    const prisma = createFakePrisma();
    process.env.LEKKI_VAULT_KEY = process.env.LEKKI_VAULT_KEY || 'test-vault-key-for-n1';
    process.env.PUBLIC_RUNTIME_ORIGIN = 'https://runtime.example.test';
    const vault = new SecretsVaultService(prisma as never);
    const setup = new SetupPaymentsService(
      prisma as never,
      {
        async provePaymentBinding() {
          return { connectorId: 'connector-payfast' };
        },
        async activatePaymentConnector() {
          return 'connector-payfast';
        },
        activePaymentConnectorId() {
          return undefined;
        },
      } as never,
      vault,
    );

    prisma.installs.push({
      id: 'pci_flip',
      organisationId: 'org_a',
      venueId: 'ven_a',
      connectorId: 'payfast',
      status: 'verified',
      environment: 'production',
      verifiedEnvironment: 'sandbox',
      configJson: { merchantId: '10000100' },
      vaultRefsJson: { merchantKey: 'svr_k', passphrase: 'svr_p' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await assert.rejects(
      () => setup.activate('org_a'),
      (err: unknown) =>
        err instanceof BadRequestException &&
        /verified for production/i.test(String((err as BadRequestException).message)),
    );
    assert.equal(prisma.installs[0].status, 'verified');
  });

  it('does not demote peer connectors when provePaymentBinding throws', async () => {
    const prisma = createFakePrisma();
    process.env.LEKKI_VAULT_KEY = process.env.LEKKI_VAULT_KEY || 'test-vault-key-for-n1';
    const vault = new SecretsVaultService(prisma as never);
    const setup = new SetupPaymentsService(
      prisma as never,
      {
        async provePaymentBinding() {
          throw new Error('PUBLIC_RUNTIME_ORIGIN or PAYFAST_NOTIFY_URL must be set');
        },
        async activatePaymentConnector() {
          throw new Error('should not install');
        },
        activePaymentConnectorId() {
          return undefined;
        },
      } as never,
      vault,
    );

    prisma.installs.push({
      id: 'pci_peer',
      organisationId: 'org_a',
      venueId: 'ven_a',
      connectorId: 'manual',
      status: 'active',
      environment: 'sandbox',
      verifiedEnvironment: 'sandbox',
      configJson: {},
      vaultRefsJson: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.installs.push({
      id: 'pci_new',
      organisationId: 'org_a',
      venueId: 'ven_a',
      connectorId: 'payfast',
      status: 'verified',
      environment: 'sandbox',
      verifiedEnvironment: 'sandbox',
      configJson: { merchantId: '10000100' },
      vaultRefsJson: { merchantKey: 'svr_k', passphrase: 'svr_p' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await assert.rejects(() => setup.activate('org_a'), BadRequestException);
    assert.equal(prisma.installs.find((r) => r.id === 'pci_peer')?.status, 'active');
    assert.equal(prisma.installs.find((r) => r.id === 'pci_new')?.status, 'verified');
  });

  it('restores prior active when activatePaymentConnector throws after write', async () => {
    const prisma = createFakePrisma();
    process.env.LEKKI_VAULT_KEY = process.env.LEKKI_VAULT_KEY || 'test-vault-key-for-n1';
    process.env.PUBLIC_RUNTIME_ORIGIN = 'https://runtime.example.test';
    const vault = new SecretsVaultService(prisma as never);
    const setup = new SetupPaymentsService(
      prisma as never,
      {
        async provePaymentBinding() {
          return { connectorId: 'connector-payfast' };
        },
        async activatePaymentConnector() {
          throw new Error('capability runtime refused install');
        },
        activePaymentConnectorId() {
          return undefined;
        },
      } as never,
      vault,
    );

    prisma.installs.push({
      id: 'pci_prior',
      organisationId: 'org_a',
      venueId: 'ven_b',
      connectorId: 'manual',
      status: 'active',
      environment: 'sandbox',
      verifiedEnvironment: 'sandbox',
      configJson: {},
      vaultRefsJson: {},
      step: 'success',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.installs.push({
      id: 'pci_new',
      organisationId: 'org_a',
      venueId: 'ven_a',
      connectorId: 'payfast',
      status: 'verified',
      environment: 'sandbox',
      verifiedEnvironment: 'sandbox',
      configJson: { merchantId: '10000100', accidentalSecret: 'should-not-leak' },
      vaultRefsJson: { merchantKey: 'svr_k', passphrase: 'svr_p' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await assert.rejects(() => setup.activate('org_a'), BadRequestException);
    assert.equal(prisma.installs.find((r) => r.id === 'pci_prior')?.status, 'active');
    assert.equal(prisma.installs.find((r) => r.id === 'pci_new')?.status, 'draft');
    assert.equal(prisma.installs.find((r) => r.id === 'pci_new')?.step, 'activate_failed');
  });

  it('saveDraft flipping environment clears verifiedEnvironment', async () => {
    const prisma = createFakePrisma();
    process.env.LEKKI_VAULT_KEY = process.env.LEKKI_VAULT_KEY || 'test-vault-key-for-n1';
    const vault = new SecretsVaultService(prisma as never);
    const setup = new SetupPaymentsService(
      prisma as never,
      {
        async provePaymentBinding() {
          return {};
        },
        async activatePaymentConnector() {
          return 'x';
        },
        activePaymentConnectorId() {
          return undefined;
        },
      } as never,
      vault,
    );

    prisma.installs.push({
      id: 'pci_live',
      organisationId: 'org_a',
      venueId: 'ven_a',
      connectorId: 'payfast',
      status: 'verified',
      environment: 'sandbox',
      verifiedEnvironment: 'sandbox',
      configJson: {
        merchantId: '10000100',
        accidentalSecret: 'should-not-leak',
        routingStrategy: 'venue',
      },
      vaultRefsJson: { merchantKey: 'svr_k', passphrase: 'svr_p' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updated = await setup.saveDraft({
      organisationId: 'org_a',
      environment: 'production',
    });
    assert.equal(updated.status, 'draft');
    assert.equal(updated.verifiedEnvironment, null);
    assert.equal(prisma.installs[0].environment, 'production');
    // maskInstall projects declared public credentials only — not raw configJson.
    assert.equal(updated.config.merchantId, '10000100');
    assert.equal(updated.config.accidentalSecret, undefined);
    assert.equal(updated.config.routingStrategy, undefined);
    assert.equal(updated.merchantId, '10000100');
    assert.equal(updated.merchantKeyMasked, '••••stored');
    assert.equal(updated.passphraseSet, true);
  });
});
