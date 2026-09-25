/**
 * Runtime email connector registry — definitions only, fail closed.
 * Platform-level (see @lekki/contracts email-connector-definition.ts): one binding
 * for the whole process, not per-venue like payments — no Setup UI, no vault Setup flow.
 */

import type { EmailConnectorDefinition } from '@lekki/contracts';
import { resendConnectorDefinition } from '@lekki/connector-resend';
import { fakeEmailConnectorDefinition } from './email-connectors/fake.definition';

const DEFINITIONS: EmailConnectorDefinition[] = [
  resendConnectorDefinition,
  fakeEmailConnectorDefinition,
];

export function listEmailConnectorDefinitions(): EmailConnectorDefinition[] {
  return [...DEFINITIONS];
}

export function normalizeEmailConnectorId(connectorId: string): string {
  return connectorId.trim().toLowerCase();
}

export function findEmailConnectorDefinition(
  connectorId: string,
): EmailConnectorDefinition | undefined {
  const raw = normalizeEmailConnectorId(connectorId);
  if (!raw) return undefined;
  return DEFINITIONS.find(
    (entry) =>
      entry.id === raw ||
      entry.connectorId === raw ||
      entry.connectorId === `connector-${raw}` ||
      entry.id === raw.replace(/^connector-/, ''),
  );
}

export function assertBindableEmailConnector(connectorId: string): EmailConnectorDefinition {
  const entry = findEmailConnectorDefinition(connectorId);
  if (!entry?.bindable) {
    throw new Error(`Unknown or non-bindable email connector: ${connectorId || '(empty)'}`);
  }
  return entry;
}
