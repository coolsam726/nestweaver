import type { FieldDef, FieldType, ModelDef } from './types.js';

/**
 * Minimal TypeORM EntitySchema surface so packs don't import typeorm at compile time
 * of `@nodeweaver/persistence` itself. Apps pass `EntitySchema` from `typeorm`.
 */
export type TypeOrmEntitySchemaCtor = new (options: {
  name: string;
  tableName: string;
  columns: Record<string, Record<string, unknown>>;
}) => unknown;

function typeOrmColumnType(type: FieldType): string {
  switch (type) {
    case 'string':
      return 'varchar';
    case 'text':
      return 'text';
    case 'boolean':
      return 'boolean';
    case 'int':
      return 'integer';
    case 'float':
      return 'real';
    case 'datetime':
      return 'datetime';
    case 'json':
    case 'string[]':
      return 'simple-json';
    default:
      return 'varchar';
  }
}

function fieldToTypeOrmColumn(field: FieldDef): Record<string, unknown> {
  const col: Record<string, unknown> = {
    type: typeOrmColumnType(field.type),
  };
  if (field.required) col.nullable = false;
  else col.nullable = true;
  if (field.default !== undefined && field.default !== 'now') {
    col.default = field.default;
  }
  if (field.default === 'now' && field.type === 'datetime') {
    col.createDate = true;
  }
  // updatedAt convention: field name handled by caller via updateDate flag if desired
  return col;
}

export function toTypeOrmEntitySchemaOptions(
  model: ModelDef,
): {
  name: string;
  tableName: string;
  columns: Record<string, Record<string, unknown>>;
} {
  const columns: Record<string, Record<string, unknown>> = {};

  if (model.id === 'uuid') {
    columns.id = { type: 'varchar', primary: true };
  } else if (model.id !== 'objectId') {
    columns.id = { type: 'integer', primary: true, generated: true };
  }

  for (const [key, field] of Object.entries(model.fields)) {
    if (key === 'createdAt' && field.default === 'now') {
      columns[key] = { type: 'datetime', createDate: true };
      continue;
    }
    if (key === 'updatedAt' && field.default === 'now') {
      columns[key] = { type: 'datetime', updateDate: true };
      continue;
    }
    columns[key] = fieldToTypeOrmColumn(field);
  }

  return {
    name: model.name,
    tableName: model.table,
    columns,
  };
}

export function defineTypeOrmEntities(
  EntitySchema: TypeOrmEntitySchemaCtor,
  models: Record<string, ModelDef>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, model] of Object.entries(models)) {
    out[key] = new EntitySchema(toTypeOrmEntitySchemaOptions(model));
  }
  return out;
}
