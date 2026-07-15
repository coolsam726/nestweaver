import type { FieldDef, FieldType, ModelDef } from './types.js';

export type MongooseLike = {
  Schema: new (def: Record<string, unknown>, opts?: Record<string, unknown>) => unknown;
  model: (name: string, schema: unknown) => unknown;
};

function mongooseType(type: FieldType): unknown {
  switch (type) {
    case 'string':
    case 'text':
      return String;
    case 'boolean':
      return Boolean;
    case 'int':
    case 'float':
      return Number;
    case 'datetime':
      return Date;
    case 'json':
      return Object;
    case 'string[]':
      return [String];
    default:
      return String;
  }
}

function fieldToMongoose(field: FieldDef): unknown {
  if (field.type === 'string[]') {
    return field.required ? { type: [String], required: true } : [String];
  }
  const def: Record<string, unknown> = { type: mongooseType(field.type) };
  if (field.required) def.required = true;
  if (field.index) def.index = true;
  if (field.default !== undefined) {
    def.default = field.default === 'now' ? Date.now : field.default;
  }
  // Shorthand: bare constructor when no extra opts
  if (!field.required && !field.index && field.default === undefined) {
    return mongooseType(field.type);
  }
  return def;
}

export function toMongooseSchemaDefinition(
  model: ModelDef,
): Record<string, unknown> {
  const def: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(model.fields)) {
    def[key] = fieldToMongoose(field);
  }
  return def;
}

export function registerMongooseModel(
  mongoose: MongooseLike,
  model: ModelDef,
): unknown {
  const { Schema, model: createModel } = mongoose;
  const schema = new Schema(toMongooseSchemaDefinition(model), {
    collection: model.table,
  });
  return createModel(model.name, schema);
}

export function defineMongooseModels(
  mongoose: MongooseLike,
  models: Record<string, ModelDef>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, model] of Object.entries(models)) {
    out[key] = registerMongooseModel(mongoose, model);
  }
  return out;
}
