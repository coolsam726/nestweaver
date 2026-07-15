import {
  assertOrmKind,
  unsupportedStore,
  type CreateStoreOptions,
} from '@nodeweaver/persistence';
import { createMongooseAccountingStore } from './mongoose-accounting-store.js';
import { createTypeOrmAccountingStore } from './typeorm-accounting-store.js';
import type {
  AccountingStoreModelMap,
  AccountingStoreWithTx,
} from './types.js';

export type CreateAccountingStoreOptions =
  CreateStoreOptions<AccountingStoreModelMap>;

/**
 * Build an {@link InvoiceStore} / {@link AccountingStore} for the given ORM.
 * Supported: `typeorm`, `mongoose`. Stubbed: `prisma`, `drizzle`.
 */
export function createAccountingStore(
  options: CreateAccountingStoreOptions,
): AccountingStoreWithTx {
  assertOrmKind(options.orm);
  switch (options.orm) {
    case 'typeorm':
      return createTypeOrmAccountingStore(options.dataSource, options.models);
    case 'mongoose':
      return createMongooseAccountingStore(options.dataSource, options.models);
    case 'prisma':
    case 'drizzle':
      return unsupportedStore(options.orm, 'createAccountingStore');
    default:
      return unsupportedStore(options.orm, 'createAccountingStore');
  }
}

export type { AccountingStoreModelMap, AccountingStoreWithTx } from './types.js';
export { createTypeOrmAccountingStore } from './typeorm-accounting-store.js';
export { createMongooseAccountingStore } from './mongoose-accounting-store.js';
