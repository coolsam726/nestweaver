/**
 * Canonical model catalog — define fields once; emit TypeORM / Prisma / Drizzle / Mongoose.
 * This is schema metadata only (not a query layer).
 */

export type FieldType =
  | 'string'
  | 'text'
  | 'boolean'
  | 'int'
  | 'float'
  | 'datetime'
  | 'json'
  | 'string[]';

/** How the primary key is represented per ORM family. */
export type IdStrategy = 'int' | 'uuid' | 'objectId';

export interface FieldDef {
  type: FieldType;
  /** Column / property is required (NOT NULL). Default false. */
  required?: boolean;
  default?: unknown;
  index?: boolean;
  /** Human label for docs / Prisma comments (optional). */
  description?: string;
}

export interface ModelDef {
  /** Logical / class name, e.g. `ErpPartner`. */
  name: string;
  /** SQL table / Mongo collection name. */
  table: string;
  /**
   * Primary key strategy.
   * - `int` — SQL autoincrement / Prisma Int
   * - `uuid` — string UUID
   * - `objectId` — Mongo `_id` (omitted from mongoose schema body)
   */
  id?: IdStrategy;
  fields: Record<string, FieldDef>;
}

export function defineModel(
  name: string,
  table: string,
  fields: Record<string, FieldDef>,
  opts?: { id?: IdStrategy },
): ModelDef {
  return {
    name,
    table,
    id: opts?.id ?? 'int',
    fields,
  };
}

/** Common tenancy + audit columns used by company-scoped pack models. */
export function companyStampFields(
  opts: { updatedAt?: boolean } = { updatedAt: true },
): Record<string, FieldDef> {
  const fields: Record<string, FieldDef> = {
    companyId: { type: 'string', index: true },
    createdAt: { type: 'datetime', default: 'now' },
  };
  if (opts.updatedAt !== false) {
    fields.updatedAt = { type: 'datetime', default: 'now' };
  }
  return fields;
}

export function f(
  type: FieldType,
  opts: Omit<FieldDef, 'type'> = {},
): FieldDef {
  return { type, ...opts };
}
