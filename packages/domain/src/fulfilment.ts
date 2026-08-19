import type { FulfilmentStatus } from '@lekki/contracts';

export interface FulfilmentWorkLine {
  transactionLineId: string;
  quantity: number;
  stationId: string;
}

export class FulfilmentAggregate {
  private constructor(
    readonly id: string,
    readonly transactionId: string,
    readonly sessionId: string,
    readonly organisationId: string,
    private _status: FulfilmentStatus,
    readonly stationId: string,
    readonly lines: FulfilmentWorkLine[],
    readonly createdAt: Date,
  ) {}

  static create(input: {
    id: string;
    transactionId: string;
    sessionId: string;
    organisationId: string;
    stationId: string;
    lines: FulfilmentWorkLine[];
  }): FulfilmentAggregate {
    return new FulfilmentAggregate(
      input.id,
      input.transactionId,
      input.sessionId,
      input.organisationId,
      'pending',
      input.stationId,
      input.lines,
      new Date(),
    );
  }

  get status(): FulfilmentStatus {
    return this._status;
  }

  updateStatus(status: FulfilmentStatus): void {
    this._status = status;
  }
}
