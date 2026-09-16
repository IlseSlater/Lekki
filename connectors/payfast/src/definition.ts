import type {
  BindingInput,
  PaymentConnectorDefinition,
  VerifyInput,
  VerifyResult,
} from '@lekki/contracts';
import { createPayFastPaymentBinding } from './payfast-connector';
import {
  assertNotifyUrlAllowedForEnvironment,
  resolvePayFastNotifyUrl,
} from './notify-url';
import { probeMerchantCredentials } from './probe';

export const PAYFAST_CONNECTOR_DEFINITION_ID = 'payfast';

/**
 * PayFast as a PaymentConnectorDefinition — credentials are declared, not columns.
 */
export const payFastConnectorDefinition: PaymentConnectorDefinition = {
  id: PAYFAST_CONNECTOR_DEFINITION_ID,
  connectorId: 'connector-payfast',
  displayName: 'PayFast',
  countries: ['ZA'],
  currencies: ['ZAR'],
  installable: true,
  bindable: true,
  capabilities: [
    'PaymentCapability.CreatePayment',
    'PaymentCapability.Authorise',
    'PaymentCapability.Refund',
    'PaymentCapability.Settlement',
    'form_post',
  ],
  credentials: [
    {
      id: 'merchantId',
      label: 'Merchant ID',
      helpText: 'From your PayFast dashboard',
      secret: false,
      required: true,
    },
    {
      id: 'merchantKey',
      label: 'Merchant Key',
      helpText: 'Stored in the vault — used to sign checkout forms',
      secret: true,
      required: true,
    },
    {
      id: 'passphrase',
      label: 'Passphrase',
      helpText: 'Required to verify ITN signatures',
      secret: true,
      required: true,
    },
  ],
  webhook: {
    pathSuffix: '/payments/payfast/notify',
    requiresPublicOrigin: true,
  },
  async verify(input: VerifyInput): Promise<VerifyResult> {
    const merchantId = (input.config.merchantId ?? '').trim();
    const merchantKey = (input.secrets.merchantKey ?? '').trim();
    const passphrase = (input.secrets.passphrase ?? '').trim();
    const probe = await probeMerchantCredentials({
      merchantId,
      merchantKey,
      passphrase,
      environment: input.environment,
    });
    if (!probe.ok) return { ok: false, reason: probe.reason };
    return {
      ok: true,
      config: { merchantId },
      businessName: probe.businessName,
      merchantStatus: probe.merchantStatus,
      country: 'ZA',
      currency: 'ZAR',
    };
  },
  createBinding(input: BindingInput) {
    const merchantId = (input.config.merchantId ?? '').trim();
    if (!merchantId) {
      throw new Error('PayFast merchant ID is required to activate');
    }
    const notifyUrl = resolvePayFastNotifyUrl();
    assertNotifyUrlAllowedForEnvironment(notifyUrl, input.environment);
    return createPayFastPaymentBinding(
      {
        merchantId,
        notifyUrl,
        resolveSecret: async (secretKey: 'merchantKey' | 'passphrase') => {
          const ref = input.vaultRefs[secretKey];
          if (!ref) return undefined;
          return input.resolveSecret(secretKey);
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
  },
};
