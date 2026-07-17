import {
  defineMongooseModels,
  type MongooseLike,
} from '@nodeweaver/persistence';
import { inventoryModelCatalog } from '../catalog.js';

export type { MongooseLike };

export function defineInventoryMongooseModels(mongoose: MongooseLike) {
  return defineMongooseModels(mongoose, inventoryModelCatalog) as {
    Warehouse: unknown;
    Location: unknown;
    Quant: unknown;
    Lot: unknown;
    Picking: unknown;
    Move: unknown;
    Adjustment: unknown;
  };
}
