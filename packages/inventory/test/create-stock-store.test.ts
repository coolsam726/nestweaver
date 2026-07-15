import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createStockStore } from '../src/adapters/create-stock-store.js';

describe('createStockStore', () => {
  it('rejects prisma until implemented', () => {
    assert.throws(
      () =>
        createStockStore({
          orm: 'prisma',
          dataSource: {},
          models: {
            picking: 'Picking',
            move: 'Move',
            location: 'Location',
            quant: 'Quant',
          },
        }),
      /not implemented/,
    );
  });

  it('builds a typeorm store object', () => {
    const repos = new Map<string, unknown>();
    const dataSource = {
      getRepository(entity: { name?: string } | string) {
        const key = typeof entity === 'string' ? entity : entity.name ?? 'X';
        if (!repos.has(key)) {
          repos.set(key, {
            findOne: async () => null,
            find: async () => [],
            create: (d: unknown) => d,
            save: async (d: unknown) => ({ id: 1, ...(d as object) }),
          });
        }
        return repos.get(key);
      },
    };
    class Picking {}
    class Move {}
    class Location {}
    class Quant {}
    const store = createStockStore({
      orm: 'typeorm',
      dataSource,
      models: {
        picking: Picking,
        move: Move,
        location: Location,
        quant: Quant,
      },
    });
    assert.equal(typeof store.findPicking, 'function');
    assert.equal(typeof store.upsertQuant, 'function');
  });
});
