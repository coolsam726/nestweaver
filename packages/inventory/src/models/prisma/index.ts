import { toPrismaSchemaFragment } from '@nodeweaver/persistence';
import { inventoryModelCatalog } from '../catalog.js';

export function inventoryPrismaSchemaFragment(header?: string): string {
  return toPrismaSchemaFragment(inventoryModelCatalog, header);
}

export const inventoryPrismaModels = inventoryPrismaSchemaFragment();
