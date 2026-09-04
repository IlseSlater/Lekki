import type {
  CreatePaymentRequest,
  FulfilmentCapability,
  FulfilmentLine,
  ContextInfo,
  PaymentCapability,
  PaymentConnectorBinding,
  ProfileRef,
  TransactionId,
} from '@lekki/contracts';
import type { ProfileEngine } from '@lekki/profile-engine';
import { err, ok, type Result } from '@lekki/shared';

export interface FulfilmentConnectorBinding {
  connectorId: string;
  capability: FulfilmentCapability;
  priority: number;
}

export type PaymentTenantRef = {
  organisationId: string;
  venueId?: string;
};

export function paymentTenantKey(ref: PaymentTenantRef): string {
  const org = ref.organisationId?.trim();
  const venue = ref.venueId?.trim();
  if (org && venue) return `${org}:${venue}`;
  return org || 'default';
}

export class CapabilityRuntime {
  private paymentBindings: PaymentConnectorBinding[] = [];
  private paymentByTenant = new Map<string, PaymentConnectorBinding>();
  private fulfilmentBindings: FulfilmentConnectorBinding[] = [];

  constructor(private readonly profiles: ProfileEngine) {}

  registerPaymentConnector(binding: PaymentConnectorBinding): void {
    this.paymentBindings.push(binding);
    this.paymentBindings.sort((a, b) => a.priority - b.priority);
  }

  /** Replace all default payment bindings with a single active connector (legacy / dev). */
  replacePaymentConnector(binding: PaymentConnectorBinding): void {
    this.paymentBindings = [binding];
  }

  /** Activate payment connector for one tenant (org or org:venue). */
  replacePaymentConnectorForTenant(
    tenant: PaymentTenantRef,
    binding: PaymentConnectorBinding,
  ): void {
    this.paymentByTenant.set(paymentTenantKey(tenant), binding);
  }

  peekPaymentConnectorId(tenant?: PaymentTenantRef): string | undefined {
    if (tenant?.organisationId) {
      const exact = this.paymentByTenant.get(paymentTenantKey(tenant));
      if (exact) return exact.connectorId;
      const orgOnly = this.paymentByTenant.get(
        paymentTenantKey({ organisationId: tenant.organisationId }),
      );
      if (orgOnly) return orgOnly.connectorId;
    }
    return this.paymentBindings[0]?.connectorId;
  }

  private pickPaymentBinding(tenant?: PaymentTenantRef): PaymentConnectorBinding | undefined {
    if (tenant?.organisationId) {
      const exact = this.paymentByTenant.get(paymentTenantKey(tenant));
      if (exact) return exact;
      const orgOnly = this.paymentByTenant.get(
        paymentTenantKey({ organisationId: tenant.organisationId }),
      );
      if (orgOnly) return orgOnly;
    }
    return this.paymentBindings[0];
  }

  registerFulfilmentConnector(binding: FulfilmentConnectorBinding): void {
    this.fulfilmentBindings.push(binding);
    this.fulfilmentBindings.sort((a, b) => a.priority - b.priority);
  }

  async resolvePaymentConnector(
    profileRef: ProfileRef,
    tenant?: PaymentTenantRef,
  ): Promise<Result<PaymentCapability>> {
    const enabled = await this.profiles.resolveCapability(
      profileRef,
      'payment.settle',
    );
    if (!enabled.ok) {
      return enabled;
    }
    if (!enabled.value) {
      return err('Payment capability not enabled for profile');
    }
    const binding = this.pickPaymentBinding(tenant);
    if (!binding) {
      return err('No payment connector registered');
    }
    return ok(binding.capability);
  }

  async resolveFulfilmentConnector(
    profileRef: ProfileRef,
  ): Promise<Result<FulfilmentCapability>> {
    const enabled = await this.profiles.resolveCapability(
      profileRef,
      'fulfilment.route',
    );
    if (!enabled.ok) {
      return enabled;
    }
    if (!enabled.value) {
      return err('Fulfilment capability not enabled for profile');
    }
    const binding = this.fulfilmentBindings[0];
    if (!binding) {
      return err('No fulfilment connector registered');
    }
    return ok(binding.capability);
  }

  async createPayment(
    profileRef: ProfileRef,
    request: CreatePaymentRequest,
    tenant?: PaymentTenantRef,
  ) {
    const connector = await this.resolvePaymentConnector(
      profileRef,
      tenant ?? { organisationId: request.organisationId },
    );
    if (!connector.ok) {
      return connector;
    }
    return ok(await connector.value.createPayment(request));
  }

  async refundPayment(
    profileRef: ProfileRef,
    paymentId: import('@lekki/contracts').PaymentId,
    amount: number,
    tenant?: PaymentTenantRef,
  ) {
    const connector = await this.resolvePaymentConnector(profileRef, tenant);
    if (!connector.ok) {
      return connector;
    }
    return ok(await connector.value.refundPayment(paymentId, amount));
  }

  async createFulfilmentsForTransaction(input: {
    profileRef: ProfileRef;
    transactionId: string;
    sessionId: string;
    organisationId: string;
    venueId: string;
    physicalContextId: string;
    lines: Array<{
      transactionLineId: string;
      quantity: number;
      routingTags: string[];
    }>;
  }) {
    const profile = await this.profiles.load(input.profileRef);
    if (!profile.ok) {
      return profile;
    }

    const connector = await this.resolveFulfilmentConnector(input.profileRef);
    if (!connector.ok) {
      return connector;
    }

    const byStation = new Map<string, FulfilmentLine[]>();
    for (const line of input.lines) {
      const stationId = this.profiles.resolveStationForTags(
        profile.value,
        line.routingTags,
      );
      if (!stationId) {
        return err('No station resolved for fulfilment line');
      }
      const bucket = byStation.get(stationId) ?? [];
      bucket.push({
        transactionLineId: line.transactionLineId,
        quantity: line.quantity,
        stationId,
      });
      byStation.set(stationId, bucket);
    }

    const context: ContextInfo = {
      organisationId: input.organisationId,
      venueId: input.venueId,
      sessionId: input.sessionId,
      physicalContextId: input.physicalContextId,
    };

    const instances = [];
    for (const [, lines] of byStation.entries()) {
      const instance = await connector.value.createFulfilment(
        input.transactionId as TransactionId,
        lines,
        context,
      );
      instances.push(instance);
    }

    return ok(instances);
  }

  async updateFulfilmentStatus(
    profileRef: ProfileRef,
    fulfilmentId: string,
    status: 'created' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled',
  ) {
    const connector = await this.resolveFulfilmentConnector(profileRef);
    if (!connector.ok) {
      return connector;
    }
    return ok(
      await connector.value.updateFulfilmentStatus(
        fulfilmentId as import('@lekki/contracts').FulfilmentId,
        status,
      ),
    );
  }
}
