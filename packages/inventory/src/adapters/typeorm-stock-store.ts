import {
  coerceId,
  passthroughTransaction,
  toPlainRecord,
} from '@nodeweaver/persistence';
import type {
  StockLocation,
  StockMove,
  StockPicking,
  StockQuant,
} from '../models/types.js';
import type { StockStoreModelMap, StockStoreWithTx } from './types.js';

type TypeOrmRepo = {
  findOne: (opts: { where: Record<string, unknown> }) => Promise<unknown>;
  find: (opts: { where: Record<string, unknown> }) => Promise<unknown[]>;
  create: (data: Record<string, unknown>) => unknown;
  save: (entity: unknown) => Promise<unknown>;
};

type TypeOrmDataSource = {
  getRepository: (entity: unknown) => TypeOrmRepo;
  transaction?: <T>(fn: (manager: {
    getRepository: (entity: unknown) => TypeOrmRepo;
  }) => Promise<T>) => Promise<T>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return toPlainRecord(value);
}

function mapPicking(row: Record<string, unknown>): StockPicking {
  return row as unknown as StockPicking;
}

function mapMove(row: Record<string, unknown>): StockMove {
  return row as unknown as StockMove;
}

function mapLocation(row: Record<string, unknown>): StockLocation {
  return row as unknown as StockLocation;
}

function mapQuant(row: Record<string, unknown>): StockQuant {
  return row as unknown as StockQuant;
}

/**
 * TypeORM-backed {@link StockStore}. Pass the same `DataSource` Loom uses.
 */
export function createTypeOrmStockStore(
  dataSource: unknown,
  models: StockStoreModelMap,
): StockStoreWithTx {
  const ds = dataSource as TypeOrmDataSource;
  const pickings = () => ds.getRepository(models.picking);
  const moves = () => ds.getRepository(models.move);
  const locations = () => ds.getRepository(models.location);
  const quants = () => ds.getRepository(models.quant);
  const products = models.product
    ? () => ds.getRepository(models.product!)
    : null;

  return {
    async findPicking(id) {
      const row = await pickings().findOne({ where: { id: coerceId(id) } });
      return row ? mapPicking(asRecord(row)) : null;
    },
    async findMovesByPicking(pickingId) {
      const rows = await moves().find({
        where: { pickingId: String(pickingId) },
      });
      // Also match numeric FK if stored as number
      if (rows.length === 0 && /^\d+$/.test(pickingId)) {
        const again = await moves().find({
          where: { pickingId: coerceId(pickingId) },
        });
        return again.map((r) => mapMove(asRecord(r)));
      }
      return rows.map((r) => mapMove(asRecord(r)));
    },
    async updatePicking(id, data) {
      const repo = pickings();
      const existing = await repo.findOne({ where: { id: coerceId(id) } });
      if (!existing) throw new Error(`Picking ${id} not found`);
      const saved = await repo.save({
        ...(existing as object),
        ...data,
        id: coerceId(id),
      });
      return mapPicking(asRecord(saved));
    },
    async updateMove(id, data) {
      const repo = moves();
      const existing = await repo.findOne({ where: { id: coerceId(id) } });
      if (!existing) throw new Error(`Move ${id} not found`);
      const saved = await repo.save({
        ...(existing as object),
        ...data,
        id: coerceId(id),
      });
      return mapMove(asRecord(saved));
    },
    async findLocation(id) {
      const row = await locations().findOne({ where: { id: coerceId(id) } });
      return row ? mapLocation(asRecord(row)) : null;
    },
    async findProduct(id) {
      if (!products) return null;
      const row = await products().findOne({ where: { id: coerceId(id) } });
      if (!row) return null;
      const r = asRecord(row);
      return {
        id: String(r.id),
        name: r.name as string | undefined,
        standardCost: r.standardCost as number | undefined,
      };
    },
    async findQuant(keys) {
      const where: Record<string, unknown> = {
        productId: String(keys.productId),
        locationId: String(keys.locationId),
      };
      if (keys.companyId != null) where.companyId = keys.companyId;
      if (keys.lotId != null) where.lotId = keys.lotId;
      else where.lotId = null as unknown as undefined;
      let row = await quants().findOne({ where });
      if (!row && keys.lotId == null) {
        // SQLite null mismatch: try without lotId filter then filter in memory
        const all = await quants().find({
          where: {
            productId: String(keys.productId),
            locationId: String(keys.locationId),
            ...(keys.companyId != null ? { companyId: keys.companyId } : {}),
          },
        });
        row =
          all.find((r) => {
            const lot = asRecord(r).lotId;
            return lot == null || lot === '';
          }) ?? null;
      }
      return row ? mapQuant(asRecord(row)) : null;
    },
    async upsertQuant(quant) {
      const repo = quants();
      if (quant.id) {
        const existing = await repo.findOne({
          where: { id: coerceId(String(quant.id)) },
        });
        if (existing) {
          const saved = await repo.save({
            ...(existing as object),
            ...quant,
            id: coerceId(String(quant.id)),
          });
          return mapQuant(asRecord(saved));
        }
      }
      const found = await this.findQuant({
        companyId: quant.companyId,
        productId: quant.productId,
        locationId: quant.locationId,
        lotId: quant.lotId,
      });
      if (found?.id) {
        const saved = await repo.save({
          ...found,
          ...quant,
          id: coerceId(String(found.id)),
        });
        return mapQuant(asRecord(saved));
      }
      const created = repo.create({ ...quant } as Record<string, unknown>);
      const saved = await repo.save(created);
      return mapQuant(asRecord(saved));
    },
    async createPicking(data) {
      const created = pickings().create({ ...data } as Record<string, unknown>);
      const saved = await pickings().save(created);
      return mapPicking(asRecord(saved));
    },
    async createMove(data) {
      const created = moves().create({ ...data } as Record<string, unknown>);
      const saved = await moves().save(created);
      return mapMove(asRecord(saved));
    },
    runInTransaction: ds.transaction
      ? async (fn) => ds.transaction!(async () => fn())
      : passthroughTransaction,
  };
}
