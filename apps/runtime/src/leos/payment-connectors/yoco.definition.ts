import type {
  BindingInput,
  PaymentConnectorDefinition,
  VerifyInput,
  VerifyResult,
} from '@lekki/contracts';

/**
 * Yoco sits on the payment registry beside PayFast so the registry shape is proven for a second gateway.
 * It stays closed (installable: false, bindable: false) until a real verify call reaches Yoco and
 * returns the merchant. Until then PayFast remains the default and the only live card gateway.
 */
export const yocoConnectorDefinition: PaymentConnectorDefinition = {
  id: 'yoco',
  connectorId: 'connector-yoco',
  displayName: 'Yoco',
  countries: ['ZA'],
  currencies: ['ZAR'],
  installable: false,
  bindable: false,
  credentials: [
    {
      id: 'secretKey',
      label: 'Secret key',
      helpText: 'From your Yoco portal.',
      secret: true,
      required: true,
    },
  ],
  capabilities: ['PaymentCapability.CreatePayment'],
  async verify(_input: VerifyInput): Promise<VerifyResult> {
    return { ok: false, reason: 'Yoco is not connected yet.' };
  },
  createBinding(_input: BindingInput) {
    throw new Error('Yoco is not installable yet.');
  },
};
