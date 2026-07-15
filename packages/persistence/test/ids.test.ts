import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertOrmKind,
  coerceId,
  recordId,
  toPlainRecord,
} from '../src/index.js';

describe('@nodeweaver/persistence', () => {
  it('normalizes mongoose-like docs', () => {
    const plain = toPlainRecord({
      _id: 'abc',
      name: 'x',
      toObject() {
        return { _id: 'abc', name: 'x' };
      },
    });
    assert.equal(plain.id, 'abc');
    assert.equal(plain.name, 'x');
  });

  it('coerces numeric string ids', () => {
    assert.equal(coerceId('42'), 42);
    assert.equal(coerceId('a1'), 'a1');
  });

  it('recordId reads id or _id', () => {
    assert.equal(recordId({ id: 7 }), '7');
    assert.equal(recordId({ _id: 'm' }), 'm');
  });

  it('assertOrmKind rejects unknown', () => {
    assert.throws(() => assertOrmKind('sequelize'), /Unsupported ORM/);
  });
});
