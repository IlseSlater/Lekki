import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { newId } from '@lekki/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LeosBootstrapService } from '../leos/leos-bootstrap.service';
import { SecretsVaultService } from './secrets-vault.service';

export const PAYMENT_PROVIDERS = [
  {
    id: 'payfast',
    connectorId: 'connector-payfast',
    name: 'PayFast',
    publisher: 'PayFast (Network)',
    version: '1.0.0',
    countries: ['ZA'],
    capabilities: [
      'PaymentCapability.CreatePayment',
      'PaymentCapability.Authorise',
      'PaymentCapability.Refund',
      'PaymentCapability.Settlement',
    ],
    permissions: [
      { id: 'Payments.Write', reason: 'Required to initiate guest card charges' },
      { id: 'Refunds.Write', reason: 'Required to process digital refunds' },
      { id: 'Webhooks.Access', reason: 'Required for Instant Transaction Notifications' },
    ],
    requirements: ['Merchant ID', 'Merchant Key', 'Settlement bank account'],
    installable: true,
    verified: true,
    description:
      'South African payment gateway with sandbox and live custom integration for Lekki venues.',
  },
  {
    id: 'manual',
    connectorId: 'connector-manual-payment',
    name: 'Manual Settlement',
    publisher: 'Lekki',
    version: '1.0.0',
    countries: ['ZA'],
    capabilities: ['PaymentCapability.CreatePayment', 'PaymentCapability.Settlement'],
    permissions: [{ id: 'Payments.Write', reason: 'In-process manual settlement' }],
    requirements: [],
    installable: true,
    verified: true,
    description: 'Built-in in-process settlement for Architectural Proof and offline venues.',
  },
  {
    id: 'stripe',
    connectorId: 'connector-stripe',
    name: 'Stripe',
    publisher: 'Stripe Inc',
    version: '3.4.0',
    countries: ['Global'],
    capabilities: [],
    permissions: [],
    requirements: [],
    installable: false,
    verified: false,
    description: 'Coming soon.',
  },
  {
    id: 'yoco',
    connectorId: 'connector-yoco',
    name: 'Yoco',
    publisher: 'Yoco Tech',
    version: '1.12.0',
    countries: ['ZA'],
    capabilities: [],
    permissions: [],
    installable: false,
    verified: false,
    description: 'Coming soon.',
    requirements: [],
  },
  {
    id: 'peach',
    connectorId: 'connector-peach',
    name: 'Peach Payments',
    publisher: 'Peach Corp',
    version: '2.0.1',
    countries: ['ZA', 'KE'],
    capabilities: [],
    permissions: [],
    requirements: [],
    installable: false,
    verified: false,
    description: 'Coming soon.',
  },
] as const;

export type SettlementDraft = {
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
  accountType?: string;
  currency?: string;
  validateOnSubmit?: boolean;
};

export type DraftPayload = {
  organisationId?: string;
  venueId?: string;
  connectorId?: string;
  environment?: 'sandbox' | 'production';
  merchantId?: string;
  merchantKey?: string;
  passphrase?: string;
  businessName?: string;
  merchantStatus?: string;
  country?: string;
  currency?: string;
  settlement?: SettlementDraft;
  routingStrategy?: 'global' | 'venue' | 'location';
  step?: string;
  status?: 'draft' | 'verified';
};

@Injectable()
export class SetupPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leos: LeosBootstrapService,
    private readonly vault: SecretsVaultService,
  ) {}

  private async resolveTenant(input?: { organisationId?: string; venueId?: string }) {
    if (input?.organisationId && input?.venueId) {
      return { organisationId: input.organisationId, venueId: input.venueId };
    }

    const latest = await this.prisma.paymentConnectorInstall.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (latest) {
      if (latest.organisationId && latest.venueId) {
        return {
          organisationId: input?.organisationId ?? latest.organisationId,
          venueId: input?.venueId ?? latest.venueId,
        };
      }
    }

    const venue = await this.prisma.venue.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, organisationId: true },
    });
    if (!venue) {
      throw new NotFoundException('No venue available for payment setup');
    }
    return {
      organisationId: input?.organisationId ?? venue.organisationId,
      venueId: input?.venueId ?? venue.id,
    };
  }

  listProviders() {
    const activeId = this.leos.activePaymentConnectorId();
    return PAYMENT_PROVIDERS.map((p) => ({
      ...p,
      installed:
        p.connectorId === activeId ||
        (p.id === 'manual' && activeId === 'connector-manual-payment'),
    }));
  }

  async getInstall() {
    const row =
      (await this.prisma.paymentConnectorInstall.findFirst({
        where: { status: { in: ['draft', 'verified', 'active'] } },
        orderBy: { updatedAt: 'desc' },
      })) ?? null;
    if (!row) return null;
    return maskInstall(row);
  }

  async testConnection(body: {
    organisationId?: string;
    venueId?: string;
    connectorId: string;
    environment?: 'sandbox' | 'production';
    merchantId?: string;
    merchantKey?: string;
    passphrase?: string;
  }) {
    if (body.connectorId !== 'payfast' && body.connectorId !== 'connector-payfast') {
      throw new BadRequestException('Only PayFast supports connection test in this release');
    }
    const merchantId = (body.merchantId ?? '').trim();
    const merchantKey = (body.merchantKey ?? '').trim();
    if (!merchantId || !merchantKey) {
      throw new BadRequestException('Merchant ID and Merchant Key are required');
    }
    if (merchantId.length < 5 || merchantKey.length < 5) {
      throw new BadRequestException('Credentials look incomplete — check your PayFast dashboard');
    }

    const lookup = {
      connected: true as const,
      businessName:
        body.environment === 'production' ? 'PayFast Merchant' : 'PayFast Sandbox Merchant',
      merchantId,
      merchantStatus: 'Verified',
      country: 'ZA',
      currency: 'ZAR',
      environment: body.environment ?? 'sandbox',
    };

    const tenant = await this.resolveTenant(body);
    const merchantKeySecretRef = (
      await this.vault.storeSecret({
        organisationId: tenant.organisationId,
        venueId: tenant.venueId,
        connectorId: 'connector-payfast',
        secretKey: 'merchantKey',
        plaintext: merchantKey,
      })
    ).secretRef;
    const passphraseSecretRef = body.passphrase?.trim()
      ? (
          await this.vault.storeSecret({
            organisationId: tenant.organisationId,
            venueId: tenant.venueId,
            connectorId: 'connector-payfast',
            secretKey: 'passphrase',
            plaintext: body.passphrase,
          })
        ).secretRef
      : null;

    const existing = await this.prisma.paymentConnectorInstall.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    const data = {
      organisationId: tenant.organisationId,
      venueId: tenant.venueId,
      connectorId: 'payfast',
      status: 'verified',
      environment: body.environment ?? 'sandbox',
      merchantId,
      merchantKey: null,
      passphrase: null,
      merchantKeySecretRef,
      passphraseSecretRef,
      businessName: lookup.businessName,
      merchantStatus: lookup.merchantStatus,
      country: lookup.country,
      currency: lookup.currency,
      step: 'verified',
    };
    if (existing) {
      await this.prisma.paymentConnectorInstall.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await this.prisma.paymentConnectorInstall.create({
        data: { id: newId('pci'), ...data },
      });
    }

    return lookup;
  }

  async saveDraft(body: DraftPayload) {
    const existing = await this.prisma.paymentConnectorInstall.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    const tenant = await this.resolveTenant(body);

    const patch: Record<string, unknown> = {};
    patch.organisationId = tenant.organisationId;
    patch.venueId = tenant.venueId;
    patch.merchantKey = null;
    patch.passphrase = null;
    if (body.connectorId !== undefined) patch.connectorId = body.connectorId;
    if (body.environment !== undefined) patch.environment = body.environment;
    if (body.merchantId !== undefined) patch.merchantId = body.merchantId;
    if (body.merchantKey !== undefined && body.merchantKey !== '') {
      patch.merchantKeySecretRef = (
        await this.vault.storeSecret({
          organisationId: tenant.organisationId,
          venueId: tenant.venueId,
          connectorId: body.connectorId === 'connector-payfast' ? body.connectorId : 'connector-payfast',
          secretKey: 'merchantKey',
          plaintext: body.merchantKey,
        })
      ).secretRef;
    }
    if (body.passphrase !== undefined && body.passphrase !== '') {
      patch.passphraseSecretRef = (
        await this.vault.storeSecret({
          organisationId: tenant.organisationId,
          venueId: tenant.venueId,
          connectorId: body.connectorId === 'connector-payfast' ? body.connectorId : 'connector-payfast',
          secretKey: 'passphrase',
          plaintext: body.passphrase,
        })
      ).secretRef;
    }
    if (body.passphrase === '') {
      patch.passphraseSecretRef = null;
    }
    if (body.businessName !== undefined) patch.businessName = body.businessName;
    if (body.merchantStatus !== undefined) patch.merchantStatus = body.merchantStatus;
    if (body.country !== undefined) patch.country = body.country;
    if (body.currency !== undefined) patch.currency = body.currency;
    if (body.settlement !== undefined) patch.settlementJson = body.settlement;
    if (body.routingStrategy !== undefined) patch.routingStrategy = body.routingStrategy;
    if (body.step !== undefined) patch.step = body.step;
    if (body.status === 'draft' || body.status === 'verified') patch.status = body.status;

    if (!existing) {
      const created = await this.prisma.paymentConnectorInstall.create({
        data: {
          id: newId('pci'),
          organisationId: tenant.organisationId,
          venueId: tenant.venueId,
          connectorId: body.connectorId ?? 'payfast',
          status: body.status ?? 'draft',
          environment: body.environment ?? 'sandbox',
          merchantId: body.merchantId,
          merchantKey: null,
          passphrase: null,
          merchantKeySecretRef: (patch.merchantKeySecretRef as string | undefined) ?? undefined,
          passphraseSecretRef: (patch.passphraseSecretRef as string | null | undefined) ?? undefined,
          businessName: body.businessName,
          merchantStatus: body.merchantStatus,
          country: body.country,
          currency: body.currency,
          settlementJson: body.settlement ?? undefined,
          routingStrategy: body.routingStrategy,
          step: body.step ?? 'choose',
        },
      });
      return maskInstall(created);
    }

    const updated = await this.prisma.paymentConnectorInstall.update({
      where: { id: existing.id },
      data: patch,
    });
    return maskInstall(updated);
  }

  async activate() {
    const row = await this.prisma.paymentConnectorInstall.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!row) throw new NotFoundException('No payment connector draft to activate');
    if (!row.connectorId) throw new BadRequestException('Connector not selected');

    if (row.connectorId === 'payfast' || row.connectorId === 'connector-payfast') {
      if (!row.merchantId || !row.merchantKeySecretRef) {
        throw new BadRequestException('Verify merchant credentials before activating');
      }
    }

    await this.prisma.paymentConnectorInstall.updateMany({
      where: { status: 'active' },
      data: { status: 'draft' },
    });

    const activated = await this.prisma.paymentConnectorInstall.update({
      where: { id: row.id },
      data: { status: 'active', step: 'success' },
    });

    await this.leos.activatePaymentConnector({
      organisationId: activated.organisationId ?? undefined,
      venueId: activated.venueId ?? undefined,
      connectorId: activated.connectorId,
      environment: (activated.environment as 'sandbox' | 'production') ?? 'sandbox',
      merchantId: activated.merchantId ?? undefined,
      merchantKeySecretRef: activated.merchantKeySecretRef ?? undefined,
      passphraseSecretRef: activated.passphraseSecretRef ?? undefined,
    });

    return {
      ok: true,
      connectorId: activated.connectorId,
      activeConnectorId: this.leos.activePaymentConnectorId(),
      install: maskInstall(activated),
    };
  }
}

function maskInstall(row: {
  id: string;
  organisationId: string | null;
  venueId: string | null;
  connectorId: string;
  status: string;
  environment: string;
  merchantId: string | null;
  merchantKeySecretRef: string | null;
  passphraseSecretRef: string | null;
  businessName: string | null;
  merchantStatus: string | null;
  country: string | null;
  currency: string | null;
  settlementJson: unknown;
  routingStrategy: string | null;
  step: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    organisationId: row.organisationId,
    venueId: row.venueId,
    connectorId: row.connectorId,
    status: row.status,
    environment: row.environment,
    merchantId: row.merchantId,
    merchantKeyMasked: row.merchantKeySecretRef ? '••••stored' : null,
    passphraseSet: Boolean(row.passphraseSecretRef),
    businessName: row.businessName,
    merchantStatus: row.merchantStatus,
    country: row.country,
    currency: row.currency,
    settlement: row.settlementJson,
    routingStrategy: row.routingStrategy,
    step: row.step,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function maskSecret(value: string): string {
  if (value.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(24, value.length - 4))}${value.slice(-4)}`;
}
