import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  companyStampFields,
  defineModel,
  defineTypeOrmEntities,
  f,
  toMongooseSchemaDefinition,
  toPrismaSchemaFragment,
  toTypeOrmEntitySchemaOptions,
} from '../src/index.js';

const Sample = defineModel('Sample', 'samples', {
  ...companyStampFields(),
  name: f('string', { required: true }),
  qty: f('float', { default: 0 }),
  tags: f('string[]'),
});

describe('model catalog emitters', () => {
  it('emits mongoose field defs with required name', () => {
    const def = toMongooseSchemaDefinition(Sample);
    assert.equal((def.name as { required?: boolean }).required, true);
    assert.ok(def.companyId);
    assert.ok(def.tags);
  });

  it('emits typeorm options with int pk and table name', () => {
    const opts = toTypeOrmEntitySchemaOptions(Sample);
    assert.equal(opts.name, 'Sample');
    assert.equal(opts.tableName, 'samples');
    assert.equal(opts.columns.id?.primary, true);
    assert.equal(opts.columns.name?.nullable, false);
  });

  it('builds EntitySchema instances when ctor provided', () => {
    class FakeSchema {
      options: unknown;
      constructor(options: unknown) {
        this.options = options;
      }
    }
    const entities = defineTypeOrmEntities(FakeSchema as never, {
      Sample,
    });
    assert.ok(entities.Sample instanceof FakeSchema);
  });

  it('emits prisma model fragment', () => {
    const prisma = toPrismaSchemaFragment({ Sample });
    assert.match(prisma, /model Sample \{/);
    assert.match(prisma, /@@map\("samples"\)/);
    assert.match(prisma, /name String/);
  });
});
