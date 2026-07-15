import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StockMoveService } from '../src/services/stock-move.service.js';
import type {
  StockMove,
  StockPicking,
  StockQuant,
  StockStore,
} from '../src/models/types.js';

function memoryStore(): StockStore & {
  quants: Map<string, StockQuant>;
  pickings: Map<string, StockPicking>;
  moves: Map<string, StockMove>;
} {
  const quants = new Map<string, StockQuant>();
  const pickings = new Map<string, StockPicking>();
  const moves = new Map<string, StockMove>();
  const key = (q: { productId: string; locationId: string; lotId?: string }) =>
    `${q.productId}|${q.locationId}|${q.lotId ?? ''}`;

  return {
    quants,
    pickings,
    moves,
    async findPicking(id) {
      return pickings.get(id) ?? null;
    },
    async findMovesByPicking(pickingId) {
      return [...moves.values()].filter((m) => m.pickingId === pickingId);
    },
    async updatePicking(id, data) {
      const cur = pickings.get(id)!;
      const next = { ...cur, ...data };
      pickings.set(id, next);
      return next;
    },
    async updateMove(id, data) {
      const cur = moves.get(id)!;
      const next = { ...cur, ...data };
      moves.set(id, next);
      return next;
    },
    async findLocation() {
      return null;
    },
    async findQuant(keys) {
      return quants.get(key(keys)) ?? null;
    },
    async upsertQuant(quant) {
      const id = quant.id ?? key(quant);
      const next = { ...quant, id };
      quants.set(key(quant), next);
      return next;
    },
  };
}

describe('StockMoveService', () => {
  it('validate updates source and destination quants', async () => {
    const store = memoryStore();
    store.pickings.set('P1', {
      id: 'P1',
      name: 'WH/IN/0001',
      pickingType: 'incoming',
      state: 'draft',
      companyId: 'c1',
    });
    store.moves.set('M1', {
      id: 'M1',
      pickingId: 'P1',
      productId: 'PROD',
      productUomQty: 10,
      locationId: 'SUP',
      locationDestId: 'STOCK',
      state: 'draft',
      priceUnit: 5,
      companyId: 'c1',
    });
    await store.upsertQuant({
      productId: 'PROD',
      locationId: 'SUP',
      quantity: 100,
      companyId: 'c1',
    });

    const svc = new StockMoveService(store);
    const done = await svc.validate('P1');
    assert.equal(done.state, 'done');

    const src = await store.findQuant({
      productId: 'PROD',
      locationId: 'SUP',
      companyId: 'c1',
    });
    const dest = await store.findQuant({
      productId: 'PROD',
      locationId: 'STOCK',
      companyId: 'c1',
    });
    assert.equal(src?.quantity, 90);
    assert.equal(dest?.quantity, 10);
  });

  it('cancel after assign releases reservation', async () => {
    const store = memoryStore();
    store.pickings.set('P1', {
      id: 'P1',
      pickingType: 'outgoing',
      state: 'draft',
      companyId: 'c1',
    });
    store.moves.set('M1', {
      id: 'M1',
      pickingId: 'P1',
      productId: 'PROD',
      productUomQty: 4,
      locationId: 'STOCK',
      locationDestId: 'CUST',
      state: 'draft',
      companyId: 'c1',
    });
    await store.upsertQuant({
      productId: 'PROD',
      locationId: 'STOCK',
      quantity: 10,
      reservedQuantity: 0,
      companyId: 'c1',
    });

    const svc = new StockMoveService(store);
    await svc.assign('P1');
    let q = await store.findQuant({
      productId: 'PROD',
      locationId: 'STOCK',
      companyId: 'c1',
    });
    assert.equal(q?.reservedQuantity, 4);

    await svc.cancel('P1');
    q = await store.findQuant({
      productId: 'PROD',
      locationId: 'STOCK',
      companyId: 'c1',
    });
    assert.equal(q?.reservedQuantity, 0);
    assert.equal((await store.findPicking('P1'))?.state, 'cancel');
  });

  it('assign fails closed on oversell', async () => {
    const store = memoryStore();
    store.pickings.set('P1', {
      id: 'P1',
      pickingType: 'outgoing',
      state: 'confirmed',
      companyId: 'c1',
    });
    store.moves.set('M1', {
      id: 'M1',
      pickingId: 'P1',
      productId: 'PROD',
      productUomQty: 5,
      locationId: 'STOCK',
      state: 'confirmed',
      companyId: 'c1',
    });
    await store.upsertQuant({
      productId: 'PROD',
      locationId: 'STOCK',
      quantity: 2,
      companyId: 'c1',
    });

    const svc = new StockMoveService(store);
    await assert.rejects(() => svc.assign('P1'), /Not enough stock/);
  });
});
