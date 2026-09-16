import type {
  BindingInput,
  PaymentConnectorDefinition,
  VerifyInput,
  VerifyResult,
} from '@lekki/contracts';
import { createManualPaymentBinding, createFakePaymentBinding } from '@lekki/connector-manual-payment';

export const manualConnectorDefinition: PaymentConnectorDefinition = {
  id: 'manual',
  connectorId: 'connector-manual-payment',
  displayName: 'Manual Settlement',
  countries: ['ZA'],
  currencies: ['ZAR'],
  installable: true,
  bindable: true,
  credentials: [],
  capabilities: ['PaymentCapability.CreatePayment', 'PaymentCapability.Settlement'],
  async verify(_input: VerifyInput): Promise<VerifyResult> {
    return { ok: true, merchantStatus: 'Manual — no gateway credentials' };
  },
  createBinding(_input: BindingInput) {
    return createManualPaymentBinding(10);
  },
};

export const fakeConnectorDefinition: PaymentConnectorDefinition = {
  id: 'fake',
  connectorId: 'connector-fake-payment',
  displayName: 'Fake Payment',
  countries: ['ZA'],
  currencies: ['ZAR'],
  installable: false,
  bindable: true,
  credentials: [],
  capabilities: ['PaymentCapability.CreatePayment', 'PaymentCapability.Settlement'],
  async verify(_input: VerifyInput): Promise<VerifyResult> {
    return { ok: false, reason: 'Fake connector is not installable' };
  },
  createBinding(_input: BindingInput) {
    return createFakePaymentBinding(10);
  },
};
