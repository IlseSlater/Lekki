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

export const FAKE_PAYMENT_CONNECTOR_ID = 'connector-fake-payment';

/** Second in-process connector for binding-swap proof */
export class FakePaymentConnector implements PaymentCapability {
  readonly connectorId = FAKE_PAYMENT_CONNECTOR_ID;

  async createPayment(request: CreatePaymentRequest): Promise<PaymentAttempt> {
    return {
      paymentId: newId('pay') as PaymentId,
      status: 'pending',
      reference: `fake_${request.transactionId}`,
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
}

export function createFakePaymentBinding(priority = 50) {
  const capability = new FakePaymentConnector();
  return {
    connectorId: capability.connectorId,
    capability,
    priority,
  };
}
