import { defineDrizzleTables } from '@nodeweaver/persistence';
import { inventoryModelCatalog } from '../catalog.js';

type DrizzleApi = Parameters<typeof defineDrizzleTables>[0];

export function defineInventoryDrizzleTables(
  api: DrizzleApi,
  opts?: { dialect?: 'sqlite' | 'pg' },
) {
  return defineDrizzleTables(api, inventoryModelCatalog, opts) as {
    Warehouse: unknown;
    Location: unknown;
    Quant: unknown;
    Lot: unknown;
    Picking: unknown;
    Move: unknown;
    Adjustment: unknown;
  };
}
