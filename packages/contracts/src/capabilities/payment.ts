import type { PaymentId, TransactionId } from '../ids';

export interface CreatePaymentRequest {
  transactionId: TransactionId;
  amount: number;
  currency: string;
  organisationId: string;
  sessionId: string;
}

/** Browser checkout hand-off when a gateway requires a form post / redirect. */
export interface PaymentCheckout {
  method: 'form_post';
  actionUrl: string;
  fields: Record<string, string>;
}

export interface PaymentAttempt {
  paymentId: PaymentId;
  status: 'pending' | 'authorised' | 'completed' | 'failed';
  reference: string;
  /** Present for redirect gateways (e.g. PayFast). Absent for in-process connectors. */
  checkout?: PaymentCheckout;
}

export interface PaymentAuthorisation {
  paymentId: PaymentId;
  authorised: boolean;
}

export interface RefundResult {
  paymentId: PaymentId;
  refundedAmount: number;
  status: 'completed' | 'failed';
}

export interface SettlementStatus {
  reference: string;
  status: 'pending' | 'settled' | 'failed';
}

export interface PaymentCapability {
  readonly connectorId: string;
  createPayment(request: CreatePaymentRequest): Promise<PaymentAttempt>;
  authorisePayment(paymentId: PaymentId): Promise<PaymentAuthorisation>;
  refundPayment(paymentId: PaymentId, amount: number): Promise<RefundResult>;
  getSettlement(reference: string): Promise<SettlementStatus>;
}

export interface PaymentConnectorBinding {
  connectorId: string;
  capability: PaymentCapability;
  priority: number;
}
