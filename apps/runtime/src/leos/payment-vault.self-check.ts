import assert from 'node:assert/strict';
import { SecretsVaultService } from './secrets-vault.service';
import { SetupPaymentsService } from './setup-payments.service';

type InstallRow = Record<string, unknown> & {
  id: string;
  organisationId: string;
  venueId: string;
  connectorId: string;
  status: string;
  environment: string;
  merchantId?: string | null;
  merchantKeySecretRef?: string | null;
  passphraseSecretRef?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function createFakePrisma() {
  const entries: Array<Record<string, unknown>> = [];
  const audits: Array<Record<string, unknown>> = [];
  const installs: InstallRow[] = [];

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
            Object.entries(args.where).every(([key, value]) => row[key] === value),
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
      async findFirst() {
        return installs.at(-1) ?? null;
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
      async updateMany(args: { where: { status?: string }; data: Record<string, unknown> }) {
        for (const row of installs) {
          if (!args.where.status || row.status === args.where.status) {
            Object.assign(row, args.data, { updatedAt: new Date() });
          }
        }
      },
    },
    venue: {
      async findFirst() {
        return { id: 'ven_demo', organisationId: 'org_demo' };
      },
    },
  };
}

async function run() {
  const prisma = createFakePrisma();
  const bootstrapCalls: Array<Record<string, unknown>> = [];
  const bootstrap = {
    async activatePaymentConnector(input: Record<string, unknown>) {
      bootstrapCalls.push(input);
      return 'connector-payfast';
    },
    activePaymentConnectorId() {
      return bootstrapCalls.at(-1)?.connectorId as string | undefined;
    },
  };

  const vault = new SecretsVaultService(prisma as never);
  const stored = await vault.storeSecret({
    organisationId: 'org_demo',
    venueId: 'ven_demo',
    connectorId: 'connector-payfast',
    secretKey: 'merchantKey',
    plaintext: 'super-secret-key',
  });

  assert.match(stored.secretRef, /^svr_/);
  assert.equal(prisma.entries.length, 1);
  assert.notEqual(prisma.entries[0]?.cipherText, 'super-secret-key');
  const resolved = await vault.resolveSecret({
    organisationId: 'org_demo',
    venueId: 'ven_demo',
    connectorId: 'connector-payfast',
    secretRef: stored.secretRef,
  });
  assert.equal(resolved, 'super-secret-key');
  assert.deepEqual(
    prisma.audits.map((row) => row.action),
    ['write', 'read'],
  );

  const setup = new SetupPaymentsService(prisma as never, bootstrap as never, vault);
  const install = await setup.saveDraft({
    connectorId: 'payfast',
    environment: 'sandbox',
    merchantId: '10000100',
    merchantKey: 'merchant-key-123',
    passphrase: 'pp-secret',
  });

  assert.equal(prisma.installs.length, 1);
  assert.equal(prisma.installs[0].merchantKey, null);
  assert.equal(prisma.installs[0].passphrase, null);
  assert.ok(prisma.installs[0].merchantKeySecretRef);
  assert.ok(prisma.installs[0].passphraseSecretRef);
  assert.equal(install.merchantKeyMasked, '••••stored');
  assert.equal(install.passphraseSet, true);

  await setup.activate();
  assert.equal(bootstrapCalls.length, 1);
  assert.equal('merchantKey' in bootstrapCalls[0], false);
  assert.equal('passphrase' in bootstrapCalls[0], false);
  assert.ok(bootstrapCalls[0].merchantKeySecretRef);

  console.log('Payment vault checks passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
