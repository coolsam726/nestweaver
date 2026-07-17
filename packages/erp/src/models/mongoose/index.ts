import {
  defineMongooseModels,
  type MongooseLike,
} from '@nodeweaver/persistence';
import { erpModelCatalog } from '../catalog.js';

export type { MongooseLike };

/** Register ERP mongoose models from the shared catalog. */
export function defineErpMongooseModels(mongoose: MongooseLike) {
  return defineMongooseModels(mongoose, erpModelCatalog) as {
    Partner: unknown;
    Product: unknown;
    UomCategory: unknown;
    Uom: unknown;
    Tax: unknown;
  };
}
