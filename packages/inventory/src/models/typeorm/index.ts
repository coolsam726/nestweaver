import {
  defineTypeOrmEntities,
  type TypeOrmEntitySchemaCtor,
} from '@nodeweaver/persistence';
import { inventoryModelCatalog } from '../catalog.js';

export function defineInventoryTypeOrmEntities(
  EntitySchema: TypeOrmEntitySchemaCtor,
) {
  return defineTypeOrmEntities(EntitySchema, inventoryModelCatalog) as {
    Warehouse: unknown;
    Location: unknown;
    Quant: unknown;
    Lot: unknown;
    Picking: unknown;
    Move: unknown;
    Adjustment: unknown;
  };
}
