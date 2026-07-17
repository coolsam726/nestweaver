import type { ModelRef } from '@nodeweaver/persistence';
import type { InvoiceStore } from '../services/invoice.service.js';

export type AccountingStoreModelMap = {
  move: ModelRef;
  moveLine: ModelRef;
  invoice?: ModelRef;
  invoiceLine?: ModelRef;
  payment?: ModelRef;
  journal?: ModelRef;
  account?: ModelRef;
  product?: ModelRef;
};

export type AccountingStoreWithTx = InvoiceStore & {
  runInTransaction?: <T>(fn: () => Promise<T>) => Promise<T>;
};
