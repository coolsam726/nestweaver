import {
  defineTypeOrmEntities,
  type TypeOrmEntitySchemaCtor,
} from '@nodeweaver/persistence';
import { accountingModelCatalog } from '../catalog.js';

export function defineAccountingTypeOrmEntities(
  EntitySchema: TypeOrmEntitySchemaCtor,
) {
  return defineTypeOrmEntities(EntitySchema, accountingModelCatalog) as {
    Account: unknown;
    Journal: unknown;
    Move: unknown;
    MoveLine: unknown;
    Invoice: unknown;
    InvoiceLine: unknown;
    Payment: unknown;
  };
}
