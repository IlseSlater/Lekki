import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { newId } from '@lekki/shared';
import type { PaymentConnectorDefinition } from '@lekki/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { LeosBootstrapService } from '../leos/leos-bootstrap.service';
import { SecretsVaultService } from './secrets-vault.service';
import {
  assertInstallablePaymentConnector,
  findPaymentConnectorDefinition,
  isInstallablePaymentConnector,
  listPaymentConnectorDefinitions,
} from './payment-connector-registry';

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
  /** Ignored on the wire — organisation always comes from the staff token. */
  organisationId?: string;
  venueId?: string;
  connectorId?: string;
  environment?: 'sandbox' | 'production';
  /** Generic credential bag (preferred). */
  credentials?: Record<string, string>;
  /** PayFast-shaped fields — still accepted until Studio speaks credentials{}. */
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

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (raw === null || raw === undefined) continue;
    const text = String(raw).trim();
    if (text === '') continue;
    out[key] = text;
  }
  return out;
}

function mergeLegacyCredentials(body: DraftPayload): Record<string, string> {
  const merged = { ...(body.credentials ?? {}) };
  if (body.merchantId !== undefined) merged.merchantId = body.merchantId;
  if (body.merchantKey !== undefined) merged.merchantKey = body.merchantKey;
  if (body.passphrase !== undefined) merged.passphrase = body.passphrase;
  return merged;
}

@Injectable()
export class SetupPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leos: LeosBootstrapService,
    private readonly vault: SecretsVaultService,
  ) {}

  private async resolveTenant(input: { organisationId: string; venueId?: string }) {
    const organisationId = input.organisationId?.trim();
    if (!organisationId) {
      throw new UnauthorizedException('Staff organisation is required');
    }

    if (input.venueId?.trim()) {
      const venue = await this.prisma.venue.findFirst({
        where: { id: input.venueId.trim(), organisationId },
        select: { id: true, organisationId: true },
      });
      if (!venue) {
        throw new NotFoundException('Venue not found for this organisation');
      }
      return { organisationId, venueId: venue.id };
    }

    const venue = await this.prisma.venue.findFirst({
      where: { organisationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, organisationId: true },
    });
    if (!venue) {
      throw new NotFoundException('No venue available for payment setup in this organisation');
    }
    return { organisationId, venueId: venue.id };
  }

  listProviders() {
    const activeId = this.leos.activePaymentConnectorId();
    const live = listPaymentConnectorDefinitions()
      .filter((def) => def.installable || def.id === 'fake')
      .filter((def) => def.id !== 'fake')
      .map((def) => ({
        id: def.id,
        connectorId: def.connectorId,
        name: def.displayName,
        publisher: def.displayName,
        countries: def.countries,
        currencies: def.currencies,
        capabilities: def.capabilities,
        credentials: def.credentials,
        webhook: def.webhook,
        installable: def.installable,
        verified: def.installable,
        description: def.displayName,
        installed:
          def.connectorId === activeId ||
          (def.id === 'manual' && activeId === 'connector-manual-payment'),
      }));

    // Marketplace placeholders — not in the bindable registry (P0 fail-closed).
    const comingSoon = [
      {
        id: 'stripe',
        connectorId: 'connector-stripe',
        name: 'Stripe',
        publisher: 'Stripe',
        countries: ['Global'],
        currencies: [] as string[],
        capabilities: [] as string[],
        credentials: [],
        installable: false,
        verified: false,
        description: 'Coming soon.',
        installed: false,
      },
      {
        id: 'yoco',
        connectorId: 'connector-yoco',
        name: 'Yoco',
        publisher: 'Yoco',
        countries: ['ZA'],
        currencies: [] as string[],
        capabilities: [] as string[],
        credentials: [],
        installable: false,
        verified: false,
        description: 'Coming soon.',
        installed: false,
      },
      {
        id: 'peach',
        connectorId: 'connector-peach',
        name: 'Peach Payments',
        publisher: 'Peach Payments',
        countries: ['ZA', 'KE'],
        currencies: [] as string[],
        capabilities: [] as string[],
        credentials: [],
        installable: false,
        verified: false,
        description: 'Coming soon.',
        installed: false,
      },
    ];

    return [...live, ...comingSoon];
  }

  async getInstall(organisationId: string) {
    const org = organisationId?.trim();
    if (!org) throw new UnauthorizedException('Staff organisation is required');

    const row =
      (await this.prisma.paymentConnectorInstall.findFirst({
        where: {
          organisationId: org,
          status: { in: ['draft', 'verified', 'active'] },
        },
        orderBy: { updatedAt: 'desc' },
      })) ?? null;
    if (!row) return null;
    return maskInstall(row);
  }

  async testConnection(body: {
    organisationId: string;
    venueId?: string;
    connectorId: string;
    environment?: 'sandbox' | 'production';
    credentials?: Record<string, string>;
    merchantId?: string;
    merchantKey?: string;
    passphrase?: string;
  }) {
    const definition = assertInstallablePaymentConnector(body.connectorId);
    const tenant = await this.resolveTenant(body);
    const existing = await this.prisma.paymentConnectorInstall.findFirst({
      where: {
        organisationId: tenant.organisationId,
        venueId: tenant.venueId,
        status: { in: ['draft', 'verified', 'active'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const environment =
      (body.environment ?? existing?.environment ?? 'sandbox') === 'production'
        ? ('production' as const)
        : ('sandbox' as const);

    const existingConfig = asStringRecord(existing?.configJson);
    const existingVaultRefs = asStringRecord(existing?.vaultRefsJson);
    const supplied = mergeLegacyCredentials(body);

    const { config, secrets } = await this.resolveCredentialValues({
      definition,
      environment,
      supplied,
      existingConfig,
      existingVaultRefs,
      organisationId: tenant.organisationId,
      venueId: tenant.venueId,
    });

    const verified = await definition.verify({
      organisationId: tenant.organisationId,
      venueId: tenant.venueId,
      environment,
      config,
      secrets,
    });
    if (!verified.ok) {
      throw new BadRequestException(verified.reason);
    }

    const nextConfig = {
      ...existingConfig,
      ...config,
      ...(verified.config ?? {}),
    };
    const nextVaultRefs = { ...existingVaultRefs };

    for (const field of definition.credentials) {
      if (!field.secret) continue;
      if (!(field.id in supplied) || supplied[field.id] === '') continue;
      const stored = await this.vault.storeSecret({
        organisationId: tenant.organisationId,
        venueId: tenant.venueId,
        connectorId: definition.connectorId,
        secretKey: field.id,
        plaintext: supplied[field.id],
      });
      nextVaultRefs[field.id] = stored.secretRef;
    }

    const data = {
      organisationId: tenant.organisationId,
      venueId: tenant.venueId,
      connectorId: definition.id,
      status: 'verified',
      environment,
      verifiedEnvironment: environment,
      configJson: nextConfig,
      vaultRefsJson: nextVaultRefs,
      businessName: verified.businessName ?? null,
      merchantStatus: verified.merchantStatus ?? null,
      country: verified.country ?? null,
      currency: verified.currency ?? null,
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

    return {
      connected: true as const,
      businessName: verified.businessName ?? definition.displayName,
      merchantId: nextConfig.merchantId ?? '',
      merchantStatus: verified.merchantStatus ?? 'Verified',
      country: verified.country ?? definition.countries[0] ?? '',
      currency: verified.currency ?? definition.currencies[0] ?? '',
      environment,
    };
  }

  async saveDraft(body: DraftPayload & { organisationId: string }) {
    const tenant = await this.resolveTenant({
      organisationId: body.organisationId,
      venueId: body.venueId,
    });

    if (body.connectorId !== undefined && body.connectorId !== '') {
      if (!isInstallablePaymentConnector(body.connectorId)) {
        throw new BadRequestException(
          `Payment connector is not installable: ${body.connectorId}`,
        );
      }
    }

    const existing = await this.prisma.paymentConnectorInstall.findFirst({
      where: {
        organisationId: tenant.organisationId,
        venueId: tenant.venueId,
        status: { in: ['draft', 'verified', 'active'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const connectorId = body.connectorId ?? existing?.connectorId ?? 'payfast';
    const definition =
      findPaymentConnectorDefinition(connectorId) ??
      assertInstallablePaymentConnector(connectorId);

    const existingConfig = asStringRecord(existing?.configJson);
    const existingVaultRefs = asStringRecord(existing?.vaultRefsJson);
    const supplied = mergeLegacyCredentials(body);
    const nextConfig = { ...existingConfig };
    const nextVaultRefs = { ...existingVaultRefs };

    for (const field of definition.credentials) {
      if (!(field.id in supplied)) continue;
      const value = supplied[field.id];
      if (field.secret) {
        if (value === '') {
          delete nextVaultRefs[field.id];
          continue;
        }
        if (!value) continue;
        const stored = await this.vault.storeSecret({
          organisationId: tenant.organisationId,
          venueId: tenant.venueId,
          connectorId: definition.connectorId,
          secretKey: field.id,
          plaintext: value,
        });
        nextVaultRefs[field.id] = stored.secretRef;
      } else if (value !== undefined) {
        if (value === '') delete nextConfig[field.id];
        else nextConfig[field.id] = value;
      }
    }

    const patch: Record<string, unknown> = {
      organisationId: tenant.organisationId,
      venueId: tenant.venueId,
      connectorId: definition.id,
      configJson: nextConfig,
      vaultRefsJson: nextVaultRefs,
    };
    if (body.environment !== undefined) patch.environment = body.environment;
    if (body.businessName !== undefined) patch.businessName = body.businessName;
    if (body.merchantStatus !== undefined) patch.merchantStatus = body.merchantStatus;
    if (body.country !== undefined) patch.country = body.country;
    if (body.currency !== undefined) patch.currency = body.currency;
    if (body.settlement !== undefined) patch.settlementJson = body.settlement;
    if (body.routingStrategy !== undefined) {
      patch.routingStrategy = body.routingStrategy;
      nextConfig.routingStrategy = body.routingStrategy;
      patch.configJson = nextConfig;
    }
    if (body.step !== undefined) patch.step = body.step;
    if (body.status === 'draft' || body.status === 'verified') patch.status = body.status;

    // P1-5: any change to environment, connector, or credentials invalidates verification.
    const credentialsTouched = Object.keys(supplied).length > 0;
    const environmentTouched =
      body.environment !== undefined && body.environment !== existing?.environment;
    const connectorTouched =
      body.connectorId !== undefined &&
      body.connectorId !== '' &&
      body.connectorId !== existing?.connectorId;
    if (credentialsTouched || environmentTouched || connectorTouched) {
      patch.status = 'draft';
      patch.verifiedEnvironment = null;
      if (body.step === undefined) patch.step = 'draft';
    }

    if (!existing) {
      const created = await this.prisma.paymentConnectorInstall.create({
        data: {
          id: newId('pci'),
          organisationId: tenant.organisationId,
          venueId: tenant.venueId,
          connectorId: definition.id,
          status: (patch.status as string | undefined) ?? body.status ?? 'draft',
          environment: body.environment ?? 'sandbox',
          verifiedEnvironment: null,
          configJson: nextConfig,
          vaultRefsJson: nextVaultRefs,
          businessName: body.businessName,
          merchantStatus: body.merchantStatus,
          country: body.country,
          currency: body.currency,
          settlementJson: body.settlement ?? undefined,
          routingStrategy: body.routingStrategy,
          step: (patch.step as string | undefined) ?? body.step ?? 'choose',
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

  async activate(organisationId: string) {
    const org = organisationId?.trim();
    if (!org) throw new UnauthorizedException('Staff organisation is required');

    const row = await this.prisma.paymentConnectorInstall.findFirst({
      where: { organisationId: org },
      orderBy: { updatedAt: 'desc' },
    });
    if (!row) throw new NotFoundException('No payment connector draft to activate');
    if (!row.connectorId) throw new BadRequestException('Connector not selected');
    if (!row.venueId) throw new BadRequestException('Venue is required before activation');

    let definition: PaymentConnectorDefinition;
    try {
      definition = assertInstallablePaymentConnector(row.connectorId);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Payment connector is not installable',
      );
    }

    const environment =
      row.environment === 'production' ? ('production' as const) : ('sandbox' as const);
    const config = asStringRecord(row.configJson);
    const vaultRefs = asStringRecord(row.vaultRefsJson);

    if (row.verifiedEnvironment !== environment) {
      throw new BadRequestException(
        `Credentials must be verified for ${environment} before activation` +
          (row.verifiedEnvironment
            ? ` (last verified: ${row.verifiedEnvironment})`
            : ' (not yet verified)'),
      );
    }

    for (const field of definition.credentials) {
      if (!field.required) continue;
      if (field.environments && !field.environments.includes(environment)) continue;
      if (field.secret) {
        if (!vaultRefs[field.id]) {
          throw new BadRequestException(`${field.label} is required before activation`);
        }
      } else if (!config[field.id]) {
        throw new BadRequestException(`${field.label} is required before activation`);
      }
    }

    const activateInput = {
      organisationId: row.organisationId,
      venueId: row.venueId,
      connectorId: row.connectorId,
      environment,
      config,
      vaultRefs,
    };

    // N1: prove binding + vault-resolvable secrets BEFORE any DB write.
    try {
      await this.leos.provePaymentBinding(activateInput);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Payment connector cannot be activated',
      );
    }

    const priorActive = await this.prisma.paymentConnectorInstall.findFirst({
      where: {
        organisationId: org,
        status: 'active',
        NOT: { id: row.id },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const activated = await this.prisma.$transaction(async (tx) => {
      await tx.paymentConnectorInstall.updateMany({
        where: {
          status: 'active',
          organisationId: org,
        },
        data: { status: 'draft' },
      });
      return tx.paymentConnectorInstall.update({
        where: { id: row.id },
        data: { status: 'active', step: 'success' },
      });
    });

    try {
      await this.leos.activatePaymentConnector({
        organisationId: activated.organisationId,
        venueId: activated.venueId,
        connectorId: activated.connectorId,
        environment,
        config: asStringRecord(activated.configJson),
        vaultRefs: asStringRecord(activated.vaultRefsJson),
      });
    } catch (err) {
      // Do not leave Studio green, and restore the previous active if we demoted it.
      await this.prisma.paymentConnectorInstall.update({
        where: { id: activated.id },
        data: { status: 'draft', step: 'activate_failed' },
      });
      if (priorActive) {
        await this.prisma.paymentConnectorInstall.update({
          where: { id: priorActive.id },
          data: { status: 'active', step: priorActive.step ?? 'success' },
        });
      }
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Payment connector failed to bind',
      );
    }

    return {
      ok: true,
      connectorId: activated.connectorId,
      activeConnectorId: this.leos.activePaymentConnectorId({
        organisationId: activated.organisationId,
        venueId: activated.venueId,
      }),
      install: maskInstall(activated),
    };
  }

  private async resolveCredentialValues(input: {
    definition: PaymentConnectorDefinition;
    environment: 'sandbox' | 'production';
    supplied: Record<string, string>;
    existingConfig: Record<string, string>;
    existingVaultRefs: Record<string, string>;
    organisationId: string;
    venueId: string;
  }) {
    const config: Record<string, string> = { ...input.existingConfig };
    const secrets: Record<string, string> = {};

    for (const field of input.definition.credentials) {
      if (field.environments && !field.environments.includes(input.environment)) continue;
      if (field.secret) {
        if (input.supplied[field.id]) {
          secrets[field.id] = input.supplied[field.id];
        } else if (input.existingVaultRefs[field.id]) {
          secrets[field.id] =
            (await this.vault.resolveSecret({
              organisationId: input.organisationId,
              venueId: input.venueId,
              connectorId: input.definition.connectorId,
              secretRef: input.existingVaultRefs[field.id],
            })) ?? '';
        }
      } else if (input.supplied[field.id] !== undefined) {
        config[field.id] = input.supplied[field.id];
      }
    }

    return { config, secrets };
  }
}

function maskInstall(row: {
  id: string;
  organisationId: string;
  venueId: string;
  connectorId: string;
  status: string;
  environment: string;
  verifiedEnvironment?: string | null;
  configJson: unknown;
  vaultRefsJson: unknown;
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
  const rawConfig = asStringRecord(row.configJson);
  const vaultRefs = asStringRecord(row.vaultRefsJson);
  const definition = findPaymentConnectorDefinition(row.connectorId);

  // Project only declared non-secret credentials — never echo configJson wholesale.
  const config: Record<string, string> = {};
  const maskedVaultRefs: Record<string, string> = {};
  if (definition) {
    for (const field of definition.credentials) {
      if (field.secret) {
        if (vaultRefs[field.id]) maskedVaultRefs[field.id] = '••••stored';
      } else if (rawConfig[field.id] !== undefined && rawConfig[field.id] !== '') {
        config[field.id] = rawConfig[field.id];
      }
    }
  }

  return {
    id: row.id,
    organisationId: row.organisationId,
    venueId: row.venueId,
    connectorId: row.connectorId,
    status: row.status,
    environment: row.environment,
    verifiedEnvironment: row.verifiedEnvironment ?? null,
    config,
    vaultRefs: maskedVaultRefs,
    /** Studio-compat projections until the wizard reads credentials[]. */
    merchantId: config.merchantId ?? null,
    merchantKeyMasked: maskedVaultRefs.merchantKey ? '••••stored' : null,
    passphraseSet: Boolean(maskedVaultRefs.passphrase),
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
