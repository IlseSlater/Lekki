/**
 * Runtime payment connector registry — definitions only, fail closed.
 * Adding a gateway = register its PaymentConnectorDefinition here (or via a future loader).
 */

import type { PaymentConnectorDefinition } from '@lekki/contracts';
import { payFastConnectorDefinition } from '@lekki/connector-payfast';
import {
  fakeConnectorDefinition,
  manualConnectorDefinition,
} from './payment-connectors/manual.definition';

const DEFINITIONS: PaymentConnectorDefinition[] = [
  payFastConnectorDefinition,
  manualConnectorDefinition,
  fakeConnectorDefinition,
];

export function listPaymentConnectorDefinitions(): PaymentConnectorDefinition[] {
  return [...DEFINITIONS];
}

export function normalizePaymentConnectorId(connectorId: string): string {
  return connectorId.trim().toLowerCase();
}

export function findPaymentConnectorDefinition(
  connectorId: string,
): PaymentConnectorDefinition | undefined {
  const raw = normalizePaymentConnectorId(connectorId);
  if (!raw) return undefined;
  return DEFINITIONS.find(
    (entry) =>
      entry.id === raw ||
      entry.connectorId === raw ||
      entry.connectorId === `connector-${raw}` ||
      entry.id === raw.replace(/^connector-/, ''),
  );
}

export function assertBindablePaymentConnector(connectorId: string): PaymentConnectorDefinition {
  const entry = findPaymentConnectorDefinition(connectorId);
  if (!entry?.bindable) {
    throw new Error(
      `Unknown or non-bindable payment connector: ${connectorId || '(empty)'}`,
    );
  }
  return entry;
}

export function assertInstallablePaymentConnector(
  connectorId: string,
): PaymentConnectorDefinition {
  const entry = findPaymentConnectorDefinition(connectorId);
  if (!entry?.installable) {
    throw new Error(
      `Payment connector is not installable: ${connectorId || '(empty)'}`,
    );
  }
  return entry;
}

export function isInstallablePaymentConnector(connectorId: string): boolean {
  return Boolean(findPaymentConnectorDefinition(connectorId)?.installable);
}

/** @deprecated Prefer findPaymentConnectorDefinition — kept for P0 test names. */
export type PaymentConnectorRegistryEntry = {
  id: string;
  connectorId: string;
  installable: boolean;
  bindable: boolean;
};

export function findPaymentConnectorRegistryEntry(
  connectorId: string,
): PaymentConnectorRegistryEntry | undefined {
  const def = findPaymentConnectorDefinition(connectorId);
  if (!def) return undefined;
  return {
    id: def.id,
    connectorId: def.connectorId,
    installable: def.installable,
    bindable: def.bindable,
  };
}
