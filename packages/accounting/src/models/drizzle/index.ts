import { defineDrizzleTables } from '@nodeweaver/persistence';
import { accountingModelCatalog } from '../catalog.js';

type DrizzleApi = Parameters<typeof defineDrizzleTables>[0];

export function defineAccountingDrizzleTables(
  api: DrizzleApi,
  opts?: { dialect?: 'sqlite' | 'pg' },
) {
  return defineDrizzleTables(api, accountingModelCatalog, opts) as {
    Account: unknown;
    Journal: unknown;
    Move: unknown;
    MoveLine: unknown;
    Invoice: unknown;
    InvoiceLine: unknown;
    Payment: unknown;
  };
}
