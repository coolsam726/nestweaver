import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { erpModelCatalog } from '../src/models/catalog.js';
import { erpPrismaSchemaFragment } from '../src/models/prisma/index.js';
import { toTypeOrmEntitySchemaOptions } from '@nodeweaver/persistence';

describe('erp model catalog', () => {
  it('lists all commercial models', () => {
    assert.deepEqual(Object.keys(erpModelCatalog).sort(), [
      'Partner',
      'Product',
      'Tax',
      'Uom',
      'UomCategory',
    ]);
  });

  it('keeps ORM kits aligned on table names', () => {
    const partner = toTypeOrmEntitySchemaOptions(erpModelCatalog.Partner);
    assert.equal(partner.tableName, 'erp_partners');
    const prisma = erpPrismaSchemaFragment();
    assert.match(prisma, /@@map\("erp_partners"\)/);
    assert.match(prisma, /model ErpProduct/);
  });
});
