import type { ModelRef } from '@nodeweaver/persistence';
import type { StockStore } from '../models/types.js';

export type StockStoreModelMap = {
  picking: ModelRef;
  move: ModelRef;
  location: ModelRef;
  quant: ModelRef;
  /** Optional product entity for valuation cost lookup. */
  product?: ModelRef;
};

export type StockStoreWithTx = StockStore & {
  runInTransaction?: <T>(fn: () => Promise<T>) => Promise<T>;
};
