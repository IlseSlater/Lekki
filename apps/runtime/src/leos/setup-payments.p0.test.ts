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
  const venues = [
    { id: 'ven_a', organisationId: 'org_a', createdAt: new Date('2026-01-01') },
    { id: 'ven_b', organisationId: 'org_b', createdAt: new Date('2026-01-02') },
  ];

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
    paymentConnectorInstall: {
      async findFirst(args?: { where?: Record<string, unknown>; orderBy?: unknown }) {
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
    },
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
    async $transaction(fn: (tx: {
      paymentConnectorInstall: {
        updateMany: (args: {
          where: { status?: string; organisationId?: string };
          data: Record<string, unknown>;
        }) => Promise<{ count: number }>;
        update: (args: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => Promise<InstallRow>;
      };
    }) => Promise<unknown>) {
      return fn({
        paymentConnectorInstall: {
          updateMany: async (args) => {
            let count = 0;
            for (const row of installs) {
              if (args.where.status && row.status !== args.where.status) continue;
              if (
                args.where.organisationId &&
                row.organisationId !== args.where.organisationId
              ) {
                continue;
              }
              Object.assign(row, args.data, { updatedAt: new Date() });
              count += 1;
            }
            return { count };
          },
          update: async (args) => {
            const row = installs.find((install) => install.id === args.where.id);
            if (!row) throw new Error('Install not found');
            Object.assign(row, args.data, { updatedAt: new Date() });
            return row;
          },
        },
      });
    },
  };
}

describe('setup payments tenant scope (P0-1 + P0-2)', () => {
  it('rejects drafting an unknown connector (stripe)', async () => {
    const prisma = createFakePrisma();
    process.env.LEKKI_VAULT_KEY = process.env.LEKKI_VAULT_KEY || 'test-vault-key-for-p0';
    const vault = new SecretsVaultService(prisma as never);
    const bootstrap = {
      async activatePaymentConnector() {
        return 'connector-payfast';
      },
      activePaymentConnectorId() {
        return undefined;
      },
    };
    const setup = new SetupPaymentsService(prisma as never, bootstrap as never, vault);

    await assert.rejects(
      () =>
        setup.saveDraft({
          organisationId: 'org_a',
          connectorId: 'stripe',
          environment: 'sandbox',
        }),
      (err: unknown) =>
        err instanceof BadRequestException &&
        /not installable/i.test(String((err as BadRequestException).message)),
    );
    assert.equal(prisma.installs.length, 0);
  });

  it('scopes saveDraft + activate to the token org and never deactivates other tenants', async () => {
    const prisma = createFakePrisma();
    process.env.LEKKI_VAULT_KEY = process.env.LEKKI_VAULT_KEY || 'test-vault-key-for-p0';
    process.env.PUBLIC_RUNTIME_ORIGIN = 'https://runtime.example.test';
    const vault = new SecretsVaultService(prisma as never);
    const bootstrapCalls: Array<Record<string, unknown>> = [];
    const bootstrap = {
      async provePaymentBinding() {
        return { connectorId: 'connector-payfast' };
      },
      async activatePaymentConnector(input: Record<string, unknown>) {
        bootstrapCalls.push(input);
        return 'connector-payfast';
      },
      activePaymentConnectorId() {
        return 'connector-payfast';
      },
    };
    const setup = new SetupPaymentsService(prisma as never, bootstrap as never, vault);

    prisma.installs.push({
      id: 'pci_other',
      organisationId: 'org_b',
      venueId: 'ven_b',
      connectorId: 'payfast',
      status: 'active',
      environment: 'sandbox',
      configJson: { merchantId: '20000200' },
      vaultRefsJson: { merchantKey: 'svr_other_key', passphrase: 'svr_other_pp' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setup.saveDraft({
      organisationId: 'org_a',
      connectorId: 'payfast',
      environment: 'sandbox',
      merchantId: '10000100',
      merchantKey: 'merchant-key-123',
      passphrase: 'pp-secret',
    });
    const mine = prisma.installs.find((r) => r.organisationId === 'org_a');
    assert.ok(mine);
    mine.status = 'verified';
    mine.verifiedEnvironment = 'sandbox';
    mine.environment = 'sandbox';

    await setup.activate('org_a');

    assert.equal(prisma.installs.find((r) => r.id === 'pci_other')?.status, 'active');
    assert.equal(prisma.installs.find((r) => r.organisationId === 'org_a')?.status, 'active');
    assert.equal(bootstrapCalls.length, 1);
    assert.equal(bootstrapCalls[0].organisationId, 'org_a');
    assert.equal((bootstrapCalls[0].config as Record<string, string>).merchantId, '10000100');
  });
});
