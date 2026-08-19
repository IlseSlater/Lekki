import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EntryRuntime } from '@lekki/runtime-entry';
import { ContextRuntime } from '@lekki/runtime-context';
import { ExperienceRuntime } from '@lekki/runtime-experience';
import { CapabilityRuntime } from '@lekki/runtime-capability';
import { ProfileEngine } from '@lekki/profile-engine';
import {
  createManualPaymentBinding,
  createFakePaymentBinding,
  createDefaultFulfilmentBinding,
} from '@lekki/connector-manual-payment';
import { createPayFastPaymentBinding } from '@lekki/connector-payfast';
import { ProfileStoreService } from './profile-store.service';
import { PrismaEntryTokenRepository } from './repositories/entry-token.repository';
import { PrismaPhysicalContextRepository } from './repositories/physical-context.repository';
import {
  PrismaPhysicalContextBinding,
  PrismaSessionRepository,
} from './repositories/session.repository';
import { PrismaService } from '../prisma/prisma.service';
import { SecretsVaultService } from './secrets-vault.service';

export interface ActivatePaymentInput {
  organisationId?: string;
  venueId?: string;
  connectorId: string;
  environment?: 'sandbox' | 'production';
  merchantId?: string;
  merchantKeySecretRef?: string;
  passphraseSecretRef?: string;
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
      const active = await this.prisma.paymentConnectorInstall.findFirst({
        where: { status: 'active' },
        orderBy: { updatedAt: 'desc' },
      });
      if (active) {
        await this.activatePaymentConnector({
          organisationId: active.organisationId ?? undefined,
          venueId: active.venueId ?? undefined,
          connectorId: active.connectorId,
          environment: (active.environment as 'sandbox' | 'production') ?? 'sandbox',
          merchantId: active.merchantId ?? undefined,
          merchantKeySecretRef: active.merchantKeySecretRef ?? undefined,
          passphraseSecretRef: active.passphraseSecretRef ?? undefined,
        });
        this.logger.log(`Restored active payment connector: ${active.connectorId}`);
      }
    } catch (err) {
      this.logger.warn(
        `Could not restore payment install from DB: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async activatePaymentConnector(input: ActivatePaymentInput) {
    const binding = this.buildPaymentBinding(input);
    this.capabilityRuntime.replacePaymentConnector(binding);
    return binding.connectorId;
  }

  activePaymentConnectorId(): string | undefined {
    return this.capabilityRuntime.peekPaymentConnectorId();
  }

  private buildPaymentBinding(input: ActivatePaymentInput) {
    switch (input.connectorId) {
      case 'payfast':
      case 'connector-payfast':
        return createPayFastPaymentBinding(
          {
            merchantId: input.merchantId,
            resolveSecret: async (secretKey: 'merchantKey' | 'passphrase') => {
              const secretRef =
                secretKey === 'merchantKey'
                  ? input.merchantKeySecretRef
                  : input.passphraseSecretRef;
              if (!secretRef || !input.organisationId || !input.venueId) return undefined;
              return this.vault.resolveSecret({
                organisationId: input.organisationId,
                venueId: input.venueId,
                connectorId: 'connector-payfast',
                secretRef,
                action: secretKey === 'passphrase' ? 'verify' : 'read',
              });
            },
            baseUrl:
              input.environment === 'production'
                ? 'https://www.payfast.co.za/eng/process'
                : 'https://sandbox.payfast.co.za/eng/process',
            validateUrl:
              input.environment === 'production'
                ? 'https://www.payfast.co.za/eng/query/validate'
                : 'https://sandbox.payfast.co.za/eng/query/validate',
          },
          10,
        );
      case 'fake':
      case 'connector-fake-payment':
        return createFakePaymentBinding(10);
      case 'manual':
      case 'connector-manual-payment':
      default:
        return createManualPaymentBinding(10);
    }
  }

  private selectPaymentBinding(connector: string | undefined) {
    return this.buildPaymentBinding({ connectorId: connector ?? 'manual' });
  }
}
