import type { OrmKind } from './kinds.js';
import type { ModelRef } from './ids.js';

/**
 * Options shared by every `create*Store` factory in erp packs.
 * `dataSource` is the same object you pass LoomModule (`DataSource`, Prisma client, Connection, etc.).
 */
export interface CreateStoreOptions<TModels extends Record<string, ModelRef | undefined>> {
  orm: OrmKind;
  dataSource: unknown;
  models: TModels;
}

export function unsupportedStore(orm: OrmKind, storeName: string): never {
  throw new Error(
    `${storeName} for ORM "${orm}" is not implemented yet. ` +
      `Provide a custom store implementing the pack port, or use orm: "typeorm" | "mongoose".`,
  );
}

/**
 * Optional transaction helper packs may call. Default is no-op (run fn directly).
 * TypeORM / Prisma implementations should override when building stores.
 */
export type RunInTransaction = <T>(fn: () => Promise<T>) => Promise<T>;

export const passthroughTransaction: RunInTransaction = async (fn) => fn();
