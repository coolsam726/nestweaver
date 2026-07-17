import {
  assertOrmKind,
  unsupportedStore,
  type CreateStoreOptions,
} from '@nodeweaver/persistence';
import { createMongooseStockStore } from './mongoose-stock-store.js';
import { createTypeOrmStockStore } from './typeorm-stock-store.js';
import type { StockStoreModelMap, StockStoreWithTx } from './types.js';

export type CreateStockStoreOptions = CreateStoreOptions<StockStoreModelMap>;

/**
 * Build a {@link StockStore} for the given ORM using the same data source as Loom.
 *
 * Supported today: `typeorm`, `mongoose`.
 * Stubbed: `prisma`, `drizzle` — implement the `StockStore` port yourself or wait for pack support.
 */
export function createStockStore(
  options: CreateStockStoreOptions,
): StockStoreWithTx {
  assertOrmKind(options.orm);
  switch (options.orm) {
    case 'typeorm':
      return createTypeOrmStockStore(options.dataSource, options.models);
    case 'mongoose':
      return createMongooseStockStore(options.dataSource, options.models);
    case 'prisma':
    case 'drizzle':
      return unsupportedStore(options.orm, 'createStockStore');
    default:
      return unsupportedStore(options.orm, 'createStockStore');
  }
}

export type { StockStoreModelMap, StockStoreWithTx } from './types.js';
export { createTypeOrmStockStore } from './typeorm-stock-store.js';
export { createMongooseStockStore } from './mongoose-stock-store.js';
