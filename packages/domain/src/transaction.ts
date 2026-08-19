export interface TransactionLine {
  id: string;
  catalogueItemId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  routingTags: string[];
  /** Guest who ordered — Continuity mine vs visit. */
  participantId?: string | null;
}

export class TransactionAggregate {
  private constructor(
    readonly id: string,
    readonly sessionId: string,
    readonly organisationId: string,
    private _status: 'draft' | 'committed' | 'settled' | 'cancelled',
    readonly currency: string,
    readonly lines: TransactionLine[],
    readonly createdAt: Date,
  ) {}

  static create(input: {
    id: string;
    sessionId: string;
    organisationId: string;
    currency: string;
    lines: TransactionLine[];
  }): TransactionAggregate {
    return new TransactionAggregate(
      input.id,
      input.sessionId,
      input.organisationId,
      'draft',
      input.currency,
      input.lines,
      new Date(),
    );
  }

  get status() {
    return this._status;
  }

  get total(): number {
    return this.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }

  commit(): void {
    if (this._status !== 'draft') {
      throw new Error('Only draft transactions can be committed');
    }
    this._status = 'committed';
  }

  settle(): void {
    if (this._status !== 'committed') {
      throw new Error('Only committed transactions can be settled');
    }
    this._status = 'settled';
  }
}
