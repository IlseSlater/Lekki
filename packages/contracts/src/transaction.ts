export interface TransactionLineView {
  id: string;
  catalogueItemId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  routingTags: string[];
}

export interface TransactionView {
  id: string;
  sessionId: string;
  organisationId: string;
  status: 'draft' | 'committed' | 'settled' | 'cancelled';
  currency: string;
  total: number;
  lines: TransactionLineView[];
}
