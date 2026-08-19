import type {
  AssignmentRecord,
  ContextInfo,
  FulfilmentCapability,
  FulfilmentId,
  FulfilmentInstance,
  FulfilmentLine,
  FulfilmentStatus,
  TransactionId,
} from '@lekki/contracts';
import { newId } from '@lekki/shared';

export const DEFAULT_FULFILMENT_CONNECTOR_ID = 'connector-default-fulfilment';

/**
 * In-process FulfilmentCapability — Phase 1 default (no external vendor).
 *
 * Stateless by design: the runtime persists fulfilment state to the database
 * and treats it as the source of truth. This connector only computes routing
 * results, so it stays correct across runtime restarts (no in-memory store to
 * lose). `updateFulfilmentStatus` is idempotent and does not require a prior
 * `createFulfilment` call in the same process.
 */
export class DefaultFulfilmentConnector implements FulfilmentCapability {
  readonly connectorId = DEFAULT_FULFILMENT_CONNECTOR_ID;

  async createFulfilment(
    transactionId: TransactionId,
    lines: FulfilmentLine[],
    _context: ContextInfo,
  ): Promise<FulfilmentInstance> {
    const stationId = lines[0]?.stationId ?? 'station-default';
    return {
      fulfilmentId: newId('ful') as FulfilmentId,
      transactionId,
      status: 'pending',
      stationId,
      lines,
    };
  }

  async updateFulfilmentStatus(
    fulfilmentId: FulfilmentId,
    status: FulfilmentStatus,
  ): Promise<FulfilmentInstance> {
    return {
      fulfilmentId,
      transactionId: '' as TransactionId,
      status,
      stationId: 'station-default',
      lines: [],
    };
  }

  async assignWork(
    fulfilmentId: FulfilmentId,
    stationOrUser: string,
  ): Promise<AssignmentRecord> {
    return {
      fulfilmentId,
      assignedTo: stationOrUser,
      assignedAt: new Date().toISOString(),
    };
  }
}

export function createDefaultFulfilmentBinding(priority = 100) {
  const capability = new DefaultFulfilmentConnector();
  return {
    connectorId: capability.connectorId,
    capability,
    priority,
  };
}
