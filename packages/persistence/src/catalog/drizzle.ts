import type { FieldDef, FieldType, ModelDef } from './types.js';

/**
 * Duck-typed drizzle sqlite/pg column builders.
 * Pass `drizzle-orm/sqlite-core` or `pg-core` exports.
 */
export type DrizzleSqlCore = {
  integer: (
    name: string,
    config?: { mode?: string },
  ) => {
    primaryKey: (opts?: { autoIncrement?: boolean }) => unknown;
    notNull: () => unknown;
    default: (v: unknown) => unknown;
  };
  text: (name: string) => {
    primaryKey: () => unknown;
    notNull: () => unknown;
    default: (v: unknown) => unknown;
  };
  real: (name: string) => {
    notNull: () => unknown;
    default: (v: unknown) => unknown;
  };
  blob?: (name: string, config?: { mode?: string }) => {
    notNull: () => unknown;
  };
};

export type DrizzleTableFn = (
  name: string,
  columns: Record<string, unknown>,
) => unknown;

function buildColumn(
  core: DrizzleSqlCore,
  name: string,
  field: FieldDef,
  dialect: 'sqlite' | 'pg',
): unknown {
  const apply = (col: {
    notNull: () => unknown;
    default: (v: unknown) => unknown;
  }) => {
    let c: unknown = col;
    if (field.required) c = (c as { notNull: () => unknown }).notNull();
    if (field.default !== undefined && field.default !== 'now') {
      c = (c as { default: (v: unknown) => unknown }).default(field.default);
    }
    return c;
  };

  switch (field.type) {
    case 'boolean':
      if (dialect === 'sqlite') {
        return apply(
          core.integer(name, { mode: 'boolean' }) as ReturnType<
            DrizzleSqlCore['integer']
          >,
        );
      }
      // pg boolean via integer mode fallback if boolean helper absent
      return apply(
        core.integer(name, { mode: 'boolean' }) as ReturnType<
          DrizzleSqlCore['integer']
        >,
      );
    case 'int':
      return apply(core.integer(name));
    case 'float':
      return apply(core.real(name));
    case 'datetime':
      return apply(
        core.integer(name, { mode: 'timestamp' }) as ReturnType<
          DrizzleSqlCore['integer']
        >,
      );
    case 'json':
    case 'string[]': {
      const textCol = core.text(name);
      return apply(textCol);
    }
    case 'text':
    case 'string':
    default:
      return apply(core.text(name));
  }
}

/**
 * Build Drizzle table objects from a model catalog.
 * @example
 * ```ts
 * import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
 * const tables = defineDrizzleTables({ sqliteTable, text, integer, real }, catalog);
 * ```
 */
export function defineDrizzleTables(
  api: {
    table: DrizzleTableFn;
    integer: DrizzleSqlCore['integer'];
    text: DrizzleSqlCore['text'];
    real: DrizzleSqlCore['real'];
  },
  models: Record<string, ModelDef>,
  opts?: { dialect?: 'sqlite' | 'pg' },
): Record<string, unknown> {
  const dialect = opts?.dialect ?? 'sqlite';
  const core: DrizzleSqlCore = {
    integer: api.integer,
    text: api.text,
    real: api.real,
  };
  const out: Record<string, unknown> = {};

  for (const [key, model] of Object.entries(models)) {
    const columns: Record<string, unknown> = {};

    if (model.id === 'uuid') {
      columns.id = api.text('id').primaryKey();
    } else if (model.id !== 'objectId') {
      columns.id = api
        .integer('id')
        .primaryKey({ autoIncrement: true });
    }

    for (const [fname, field] of Object.entries(model.fields)) {
      columns[fname] = buildColumn(core, fname, field, dialect);
    }

    out[key] = api.table(model.table, columns);
  }

  return out;
}
