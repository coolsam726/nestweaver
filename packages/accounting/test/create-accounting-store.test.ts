import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAccountingStore } from '../src/adapters/create-accounting-store.js';

describe('createAccountingStore', () => {
  it('rejects drizzle until implemented', () => {
    assert.throws(
      () =>
        createAccountingStore({
          orm: 'drizzle',
          dataSource: {},
          models: { move: 'Move', moveLine: 'Line' },
        }),
      /not implemented/,
    );
  });

  it('builds a typeorm accounting store', () => {
    const dataSource = {
      getRepository() {
        return {
          findOne: async () => null,
          find: async () => [],
          create: (d: unknown) => d,
          save: async (d: unknown) => ({ id: 1, ...(d as object) }),
        };
      },
    };
    class Move {}
    class Line {}
    const store = createAccountingStore({
      orm: 'typeorm',
      dataSource,
      models: { move: Move, moveLine: Line },
    });
    assert.equal(typeof store.createMove, 'function');
    assert.equal(typeof store.post, 'undefined');
  });
});
