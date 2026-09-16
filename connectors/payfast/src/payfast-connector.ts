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
import { generateSignature, verifyItnSignature } from './signature';
import {
  confirmItnWithPayFast,
  formatPayFastAmount,
  mapItnStatus,
  checkItnAmountGross,
} from './validate';
import { resolvePayFastNotifyUrl } from './notify-url';

export const PAYFAST_PAYMENT_CONNECTOR_ID = 'connector-payfast';

export interface PayFastConfig {
  merchantId: string;
  /** PayFast process endpoint. Sandbox by default. */
  baseUrl: string;
  /** PayFast ITN validate endpoint. */
  validateUrl: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  merchantKey?: string;
  passphrase?: string;
  resolveSecret?: (secretKey: 'merchantKey' | 'passphrase') => Promise<string | undefined>;
  /** When false, skip live validate call (local unit tests). Default true. */
  confirmWithServer?: boolean;
  fetchImpl?: typeof fetch;
}

export type PayFastItnPayload = Record<string, string>;

export interface PayFastItnResult {
  ok: boolean;
  reason?: string;
  paymentId?: string;
  settlement: 'pending' | 'settled' | 'failed';
  pfPaymentId?: string;
  amountGross?: number;
  /** Present when amount_gross anti-spoof rejected the ITN. */
  amountRejectCode?: 'missing_gross' | 'underpay' | 'mismatch';
}

/**
 * PayFast sandbox / live custom-integration connector.
 *
 * `createPayment` returns a signed form_post checkout. Settlement is driven by
 * ITN (`handleItn`) — not by the guest calling complete.
 */
export class PayFastPaymentConnector implements PaymentCapability {
  readonly connectorId = PAYFAST_PAYMENT_CONNECTOR_ID;
  private readonly config: PayFastConfig;
  /** Last created payment amount by paymentId — used for ITN amount checks. */
  private readonly amounts = new Map<string, number>();

  constructor(config: PayFastConfig) {
    this.config = {
      confirmWithServer: true,
      ...config,
    };
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentAttempt> {
    if (!this.config.merchantId?.trim()) {
      throw new Error('PayFast merchant ID not configured');
    }
    const paymentId = newId('pay') as PaymentId;
    const amount = formatPayFastAmount(request.amount);
    this.amounts.set(paymentId, request.amount);
    const merchantKey = await this.getMerchantKey();
    const passphrase = await this.getPassphrase();

    // Attribute-description order (not alphabetical) — required for custom integration.
    const fields: Record<string, string> = {
      merchant_id: this.config.merchantId,
      merchant_key: merchantKey,
      return_url: this.config.returnUrl,
      cancel_url: this.config.cancelUrl,
      notify_url: this.config.notifyUrl,
      m_payment_id: paymentId,
      amount,
      item_name: `LEOS ${request.transactionId}`,
      custom_str1: request.sessionId,
      custom_str2: request.organisationId,
    };

    const signature = generateSignature(fields, passphrase);
    fields.signature = signature;

    return {
      paymentId,
      status: 'pending',
      reference: paymentId,
      checkout: {
        method: 'form_post',
        actionUrl: this.config.baseUrl,
        fields,
      },
    };
  }

  async authorisePayment(paymentId: PaymentId): Promise<PaymentAuthorisation> {
    return { paymentId, authorised: true };
  }

  async refundPayment(paymentId: PaymentId, amount: number): Promise<RefundResult> {
    // PayFast refunds use a separate merchant API; out of scope for sandbox ITN proof.
    return { paymentId, refundedAmount: 0, status: 'failed' };
  }

  async getSettlement(reference: string): Promise<SettlementStatus> {
    // Settlement is confirmed via ITN + validate; callers should use handleItn.
    return { reference, status: 'pending' };
  }

  /**
   * Process an Instant Transaction Notification from PayFast.
   * Order: signature → amount anti-spoof → server validate → status map.
   * Settlement is never implied by a client redirect.
   */
  async handleItn(
    posted: PayFastItnPayload,
    expectedAmount?: number,
  ): Promise<PayFastItnResult> {
    const passphrase = await this.getPassphrase();
    if (!verifyItnSignature(posted, passphrase)) {
      return { ok: false, reason: 'Invalid signature', settlement: 'pending' };
    }

    const paymentId = posted.m_payment_id;
    if (!paymentId) {
      return { ok: false, reason: 'Missing m_payment_id', settlement: 'pending' };
    }

    const expected = expectedAmount ?? this.amounts.get(paymentId);
    if (expected !== undefined) {
      const amountCheck = checkItnAmountGross(expected, posted.amount_gross);
      if (!amountCheck.ok) {
        return {
          ok: false,
          reason: amountCheck.reason,
          paymentId,
          settlement: 'failed',
          amountGross: amountCheck.amountGross,
          amountRejectCode: amountCheck.code,
        };
      }
    }

    // Source verification — never skip in production bindings (tests set confirmWithServer: false).
    if (this.config.confirmWithServer !== false) {
      let valid = false;
      try {
        valid = await confirmItnWithPayFast(
          posted,
          this.config.validateUrl,
          this.config.fetchImpl ?? fetch,
        );
      } catch (err) {
        return {
          ok: false,
          reason: `PayFast validate error: ${err instanceof Error ? err.message : String(err)}`,
          paymentId,
          settlement: 'pending',
        };
      }
      if (!valid) {
        return {
          ok: false,
          reason: 'PayFast validate rejected payload',
          paymentId,
          settlement: 'pending',
        };
      }
    }

    const amountGross = posted.amount_gross
      ? Number.parseFloat(posted.amount_gross)
      : undefined;
    const settlement = mapItnStatus(posted.payment_status);
    return {
      ok: true,
      paymentId,
      settlement,
      pfPaymentId: posted.pf_payment_id,
      amountGross,
    };
  }

  private async getMerchantKey() {
    if (this.config.resolveSecret) {
      const value = await this.config.resolveSecret('merchantKey');
      if (!value) {
        throw new Error('PayFast merchant key not available from vault');
      }
      return value;
    }
    const value = this.config.merchantKey;
    if (!value) throw new Error('PayFast merchant key not configured');
    return value;
  }

  private async getPassphrase() {
    if (this.config.resolveSecret) {
      // Passphrase may be unset in PayFast sandbox; vault miss is empty string not failure.
      return (await this.config.resolveSecret('passphrase')) || undefined;
    }
    return this.config.passphrase;
  }
}

export function resolvePayFastConfig(
  overrides?: Partial<PayFastConfig>,
): PayFastConfig {
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:4200';
  const merchantId =
    overrides?.merchantId ?? process.env.PAYFAST_MERCHANT_ID ?? '';
  const merchantKey =
    overrides?.merchantKey ?? process.env.PAYFAST_MERCHANT_KEY ?? '';
  // No published-sandbox defaults and no localhost ITN default — fail closed.
  const notifyUrl = resolvePayFastNotifyUrl(overrides?.notifyUrl);

  return {
    merchantId,
    merchantKey: merchantKey || undefined,
    passphrase:
      overrides?.passphrase ??
      (process.env.PAYFAST_PASSPHRASE || undefined),
    // Must forward — createPayFastPaymentBinding + Studio vault activation depend on it.
    resolveSecret: overrides?.resolveSecret,

    baseUrl:
      overrides?.baseUrl ??
      process.env.PAYFAST_BASE_URL ??
      'https://sandbox.payfast.co.za/eng/process',
    validateUrl:
      overrides?.validateUrl ??
      process.env.PAYFAST_VALIDATE_URL ??
      'https://sandbox.payfast.co.za/eng/query/validate',
    returnUrl:
      overrides?.returnUrl ??
      process.env.PAYFAST_RETURN_URL ??
      `${webOrigin}/guest?payment=return`,
    cancelUrl:
      overrides?.cancelUrl ??
      process.env.PAYFAST_CANCEL_URL ??
      `${webOrigin}/guest?payment=cancel`,
    notifyUrl,
    confirmWithServer:
      overrides?.confirmWithServer ??
      (process.env.PAYFAST_CONFIRM_WITH_SERVER === '0' ? false : undefined),
    fetchImpl: overrides?.fetchImpl,
  };
}

export function createPayFastPaymentBinding(
  config?: Partial<PayFastConfig>,
  priority = 10,
) {
  const capability = new PayFastPaymentConnector(resolvePayFastConfig(config));
  return {
    connectorId: capability.connectorId,
    capability,
    priority,
  };
}
