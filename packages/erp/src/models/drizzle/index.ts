import { defineDrizzleTables } from '@nodeweaver/persistence';
import { erpModelCatalog } from '../catalog.js';

type DrizzleApi = Parameters<typeof defineDrizzleTables>[0];

/**
 * Drizzle table objects for ERP (from the shared catalog).
 *
 * @example
 * ```ts
 * import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
 * import { defineErpDrizzleTables } from '@nodeweaver/erp/drizzle';
 * const tables = defineErpDrizzleTables({ table: sqliteTable, text, integer, real });
 * ```
 */
export function defineErpDrizzleTables(
  api: DrizzleApi,
  opts?: { dialect?: 'sqlite' | 'pg' },
) {
  return defineDrizzleTables(api, erpModelCatalog, opts) as {
    Partner: unknown;
    Product: unknown;
    UomCategory: unknown;
    Uom: unknown;
    Tax: unknown;
  };
}
