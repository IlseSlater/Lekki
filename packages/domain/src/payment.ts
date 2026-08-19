export class PaymentAggregate {
  private constructor(
    readonly id: string,
    readonly transactionId: string,
    readonly sessionId: string,
    readonly organisationId: string,
    readonly amount: number,
    readonly currency: string,
  private _status: 'pending' | 'authorised' | 'completed' | 'failed',
    readonly reference: string,
    readonly connectorId: string,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    id: string;
    transactionId: string;
    sessionId: string;
    organisationId: string;
    amount: number;
    currency: string;
    reference: string;
    connectorId: string;
  }): PaymentAggregate {
    return new PaymentAggregate(
      input.id,
      input.transactionId,
      input.sessionId,
      input.organisationId,
      input.amount,
      input.currency,
      'pending',
      input.reference,
      input.connectorId,
      new Date(),
    );
  }

  get status() {
    return this._status;
  }

  complete(): void {
    this._status = 'completed';
  }

  fail(): void {
    this._status = 'failed';
  }
}
