import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EntryRuntime } from '@lekki/runtime-entry';
import { ContextRuntime } from '@lekki/runtime-context';
import { ExperienceRuntime } from '@lekki/runtime-experience';
import { CapabilityRuntime, paymentTenantKey, type PaymentTenantRef } from '@lekki/runtime-capability';
import { ProfileEngine } from '@lekki/profile-engine';
import { createDefaultFulfilmentBinding } from '@lekki/connector-manual-payment';
import { ProfileStoreService } from './profile-store.service';
import { PrismaEntryTokenRepository } from './repositories/entry-token.repository';
import { PrismaPhysicalContextRepository } from './repositories/physical-context.repository';
import {
  PrismaPhysicalContextBinding,
  PrismaSessionRepository,
} from './repositories/session.repository';
import { PrismaService } from '../prisma/prisma.service';
import { SecretsVaultService } from './secrets-vault.service';
import { assertBindablePaymentConnector } from './payment-connector-registry';

export interface ActivatePaymentInput {
  organisationId?: string;
  venueId?: string;
  connectorId: string;
  environment?: 'sandbox' | 'production';
  config?: Record<string, string>;
  vaultRefs?: Record<string, string>;
}

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

@Injectable()
export class LeosBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(LeosBootstrapService.name);
  readonly profileEngine: ProfileEngine;
  readonly entryRuntime: EntryRuntime;
  readonly contextRuntime: ContextRuntime;
  readonly experienceRuntime: ExperienceRuntime;
  readonly capabilityRuntime: CapabilityRuntime;

  constructor(
    profileStore: ProfileStoreService,
    entryTokens: PrismaEntryTokenRepository,
    contexts: PrismaPhysicalContextRepository,
    sessions: PrismaSessionRepository,
    binding: PrismaPhysicalContextBinding,
    private readonly prisma: PrismaService,
    private readonly vault: SecretsVaultService,
  ) {
    this.profileEngine = new ProfileEngine(profileStore);
    this.entryRuntime = new EntryRuntime(entryTokens);
    this.contextRuntime = new ContextRuntime(contexts, this.profileEngine);
    this.experienceRuntime = new ExperienceRuntime(
      sessions,
      binding,
      this.profileEngine,
    );
    this.capabilityRuntime = new CapabilityRuntime(this.profileEngine);

    this.capabilityRuntime.registerPaymentConnector(
      this.selectPaymentBinding(process.env.PAYMENT_CONNECTOR),
    );
    this.capabilityRuntime.registerFulfilmentConnector(
      createDefaultFulfilmentBinding(10),
    );
  }

  async onModuleInit() {
    try {
      const actives = await this.prisma.paymentConnectorInstall.findMany({
        where: { status: 'active' },
        orderBy: { updatedAt: 'desc' },
      });
      for (const active of actives) {
        if (!active.organisationId) continue;
        try {
          await this.activatePaymentConnector({
            organisationId: active.organisationId,
            venueId: active.venueId ?? undefined,
            connectorId: active.connectorId,
            environment: (active.environment as 'sandbox' | 'production') ?? 'sandbox',
            config: asStringRecord(active.configJson),
            vaultRefs: asStringRecord(active.vaultRefsJson),
          });
          this.logger.log(
            `Restored active payment connector: ${active.connectorId} (${paymentTenantKey({
              organisationId: active.organisationId,
              venueId: active.venueId ?? undefined,
            })})`,
          );
        } catch (err) {
          this.logger.error(
            `Refusing to restore payment connector ${active.connectorId} for ${active.organisationId}: ${
              err instanceof Error ? err.message : err
            }`,
          );
          // Do not leave Studio green for a connector that failed to bind.
          try {
            await this.prisma.paymentConnectorInstall.update({
              where: { id: active.id },
              data: { status: 'draft', step: 'restore_failed' },
            });
          } catch (demoteErr) {
            this.logger.error(
              `Could not demote failed restore ${active.id}: ${
                demoteErr instanceof Error ? demoteErr.message : demoteErr
              }`,
            );
          }
        }
      }
    } catch (err) {
      this.logger.warn(
        `Could not restore payment install from DB: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /**
   * Build the binding and prove required secrets are retrievable — surfaces
   * notify/credential/vault guards before any database mutation (N1).
   */
  async provePaymentBinding(input: ActivatePaymentInput) {
    const binding = this.buildPaymentBinding(input);
    await this.assertRequiredSecretsResolvable(input);
    return binding;
  }

  async activatePaymentConnector(input: ActivatePaymentInput) {
    const binding = await this.provePaymentBinding(input);
    if (input.organisationId) {
      const tenant: PaymentTenantRef = {
        organisationId: input.organisationId,
        venueId: input.venueId,
      };
      this.capabilityRuntime.replacePaymentConnectorForTenant(tenant, binding);
    } else {
      this.capabilityRuntime.replacePaymentConnector(binding);
    }
    return binding.connectorId;
  }

  activePaymentConnectorId(tenant?: PaymentTenantRef): string | undefined {
    return this.capabilityRuntime.peekPaymentConnectorId(tenant);
  }

  private async assertRequiredSecretsResolvable(input: ActivatePaymentInput) {
    const definition = assertBindablePaymentConnector(input.connectorId);
    const environment =
      input.environment === 'production' ? ('production' as const) : ('sandbox' as const);
    const organisationId = input.organisationId ?? '';
    const venueId = input.venueId ?? '';
    const vaultRefs = input.vaultRefs ?? {};

    for (const field of definition.credentials) {
      if (!field.secret || !field.required) continue;
      if (field.environments && !field.environments.includes(environment)) continue;
      const secretRef = vaultRefs[field.id];
      if (!secretRef) {
        throw new Error(`${field.label} vault ref is missing`);
      }
      if (!organisationId || !venueId) {
        throw new Error(`${field.label} cannot be resolved without organisation and venue`);
      }
      const plaintext = await this.vault.resolveSecret({
        organisationId,
        venueId,
        connectorId: definition.connectorId,
        secretRef,
        action: field.id === 'passphrase' ? 'verify' : 'read',
      });
      if (!plaintext) {
        throw new Error(`${field.label} could not be resolved from vault`);
      }
    }
  }

  private buildPaymentBinding(input: ActivatePaymentInput) {
    const definition = assertBindablePaymentConnector(input.connectorId);
    const environment =
      input.environment === 'production' ? ('production' as const) : ('sandbox' as const);
    const organisationId = input.organisationId ?? '';
    const venueId = input.venueId ?? '';
    const vaultRefs = input.vaultRefs ?? {};

    return definition.createBinding({
      organisationId,
      venueId,
      environment,
      config: input.config ?? {},
      vaultRefs,
      resolveSecret: async (secretKey: string) => {
        const secretRef = vaultRefs[secretKey];
        if (!secretRef || !organisationId || !venueId) return undefined;
        return this.vault.resolveSecret({
          organisationId,
          venueId,
          connectorId: definition.connectorId,
          secretRef,
          action: secretKey === 'passphrase' ? 'verify' : 'read',
        });
      },
    });
  }

  private selectPaymentBinding(connector: string | undefined) {
    return this.buildPaymentBinding({ connectorId: connector ?? 'manual' });
  }
}
