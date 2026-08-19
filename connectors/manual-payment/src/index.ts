import type {
  CreatePaymentRequest,
  PaymentAttempt,
  PaymentAuthorisation,
  PaymentCapability,
  PaymentId,
  RefundResult,
  SettlementStatus,
} from '@lekki/contracts';
import { newId } from '@lekki/shared';

export const MANUAL_PAYMENT_CONNECTOR_ID = 'connector-manual-payment';

export class ManualPaymentConnector implements PaymentCapability {
  readonly connectorId = MANUAL_PAYMENT_CONNECTOR_ID;

  async createPayment(request: CreatePaymentRequest): Promise<PaymentAttempt> {
    return {
      paymentId: newId('pay') as PaymentId,
      status: 'pending',
      reference: `manual_${request.transactionId}`,
    };
  }

  async authorisePayment(paymentId: PaymentId): Promise<PaymentAuthorisation> {
    return { paymentId, authorised: true };
  }

  async refundPayment(paymentId: PaymentId, amount: number): Promise<RefundResult> {
    return { paymentId, refundedAmount: amount, status: 'completed' };
  }

  async getSettlement(reference: string): Promise<SettlementStatus> {
    return { reference, status: 'settled' };
  }

  async completePayment(paymentId: PaymentId): Promise<PaymentAttempt> {
    return {
      paymentId,
      status: 'completed',
      reference: `manual_complete_${paymentId}`,
    };
  }
}

export function createManualPaymentBinding(priority = 100) {
  const capability = new ManualPaymentConnector();
  return {
    connectorId: capability.connectorId,
    capability,
    priority,
  };
}

export * from './fake-connector';
export * from './default-fulfilment';
