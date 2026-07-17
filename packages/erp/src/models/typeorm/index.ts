import {
  defineTypeOrmEntities,
  type TypeOrmEntitySchemaCtor,
} from '@nodeweaver/persistence';
import { erpModelCatalog } from '../catalog.js';

/**
 * TypeORM `EntitySchema` instances for ERP tables (from the shared catalog).
 * Pass `EntitySchema` from `typeorm` so the pack never hard-depends on it.
 *
 * @example
 * ```ts
 * import { EntitySchema, DataSource } from 'typeorm';
 * import { defineErpTypeOrmEntities } from '@nodeweaver/erp/typeorm';
 * const entities = Object.values(defineErpTypeOrmEntities(EntitySchema));
 * ```
 */
export function defineErpTypeOrmEntities(EntitySchema: TypeOrmEntitySchemaCtor) {
  return defineTypeOrmEntities(EntitySchema, erpModelCatalog) as {
    Partner: unknown;
    Product: unknown;
    UomCategory: unknown;
    Uom: unknown;
    Tax: unknown;
  };
}
