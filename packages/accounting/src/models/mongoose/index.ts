import {
  defineMongooseModels,
  type MongooseLike,
} from '@nodeweaver/persistence';
import { accountingModelCatalog } from '../catalog.js';

export type { MongooseLike };

export function defineAccountingMongooseModels(mongoose: MongooseLike) {
  return defineMongooseModels(mongoose, accountingModelCatalog) as {
    Account: unknown;
    Journal: unknown;
    Move: unknown;
    MoveLine: unknown;
    Invoice: unknown;
    InvoiceLine: unknown;
    Payment: unknown;
  };
}
