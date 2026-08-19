import type { FulfilmentId, TransactionId } from '../ids';

export type FulfilmentStatus =
  | 'created'
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface FulfilmentLine {
  transactionLineId: string;
  quantity: number;
  stationId: string;
}

export interface ContextInfo {
  organisationId: string;
  venueId: string;
  sessionId: string;
  physicalContextId: string;
}

export interface FulfilmentInstance {
  fulfilmentId: FulfilmentId;
  transactionId: TransactionId;
  status: FulfilmentStatus;
  stationId: string;
  lines: FulfilmentLine[];
}

export interface AssignmentRecord {
  fulfilmentId: FulfilmentId;
  assignedTo: string;
  assignedAt: string;
}

export interface FulfilmentCapability {
  readonly connectorId: string;
  createFulfilment(
    transactionId: TransactionId,
    lines: FulfilmentLine[],
    context: ContextInfo,
  ): Promise<FulfilmentInstance>;
  updateFulfilmentStatus(
    fulfilmentId: FulfilmentId,
    status: FulfilmentStatus,
  ): Promise<FulfilmentInstance>;
  assignWork(
    fulfilmentId: FulfilmentId,
    stationOrUser: string,
  ): Promise<AssignmentRecord>;
}
