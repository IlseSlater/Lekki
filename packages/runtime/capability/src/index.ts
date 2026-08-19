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

export class CapabilityRuntime {
  private paymentBindings: PaymentConnectorBinding[] = [];
  private fulfilmentBindings: FulfilmentConnectorBinding[] = [];

  constructor(private readonly profiles: ProfileEngine) {}

  registerPaymentConnector(binding: PaymentConnectorBinding): void {
    this.paymentBindings.push(binding);
    this.paymentBindings.sort((a, b) => a.priority - b.priority);
  }

  /** Replace all payment bindings with a single active connector (Setup Studio activate). */
  replacePaymentConnector(binding: PaymentConnectorBinding): void {
    this.paymentBindings = [binding];
  }

  peekPaymentConnectorId(): string | undefined {
    return this.paymentBindings[0]?.connectorId;
  }

  registerFulfilmentConnector(binding: FulfilmentConnectorBinding): void {
    this.fulfilmentBindings.push(binding);
    this.fulfilmentBindings.sort((a, b) => a.priority - b.priority);
  }

  async resolvePaymentConnector(
    profileRef: ProfileRef,
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
    const binding = this.paymentBindings[0];
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
  ) {
    const connector = await this.resolvePaymentConnector(profileRef);
    if (!connector.ok) {
      return connector;
    }
    return ok(await connector.value.createPayment(request));
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
