import {
  modelRefKey,
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

type MongooseModel = {
  findById: (id: string) => { lean: () => Promise<unknown> };
  find: (filter: Record<string, unknown>) => {
    lean: () => Promise<unknown[]>;
  };
  findOne: (filter: Record<string, unknown>) => {
    lean: () => Promise<unknown>;
  };
  findByIdAndUpdate: (
    id: string,
    data: Record<string, unknown>,
    opts: { new: boolean },
  ) => { lean: () => Promise<unknown> };
  create: (data: Record<string, unknown>) => Promise<unknown>;
  findOneAndUpdate: (
    filter: Record<string, unknown>,
    data: Record<string, unknown>,
    opts: { new: boolean; upsert: boolean; setDefaultsOnInsert?: boolean },
  ) => { lean: () => Promise<unknown> };
};

type MongooseConnection = {
  model: (name: string) => MongooseModel;
  models?: Record<string, MongooseModel>;
  startSession?: () => Promise<{
    withTransaction: (fn: () => Promise<void>) => Promise<void>;
    endSession: () => Promise<void>;
  }>;
};

function resolveModel(conn: MongooseConnection, ref: StockStoreModelMap[keyof StockStoreModelMap]): MongooseModel {
  const key = modelRefKey(ref as NonNullable<typeof ref>);
  if (conn.models?.[key]) return conn.models[key]!;
  return conn.model(key);
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
 * Mongoose-backed {@link StockStore}. Pass the same `Connection` Loom uses.
 */
export function createMongooseStockStore(
  dataSource: unknown,
  models: StockStoreModelMap,
): StockStoreWithTx {
  const conn = dataSource as MongooseConnection;
  const pickings = () => resolveModel(conn, models.picking);
  const moves = () => resolveModel(conn, models.move);
  const locations = () => resolveModel(conn, models.location);
  const quants = () => resolveModel(conn, models.quant);
  const products = models.product
    ? () => resolveModel(conn, models.product!)
    : null;

  return {
    async findPicking(id) {
      const row = await pickings().findById(id).lean();
      return row ? mapPicking(toPlainRecord(row)) : null;
    },
    async findMovesByPicking(pickingId) {
      const rows = await moves().find({ pickingId }).lean();
      return rows.map((r) => mapMove(toPlainRecord(r)));
    },
    async updatePicking(id, data) {
      const row = await pickings()
        .findByIdAndUpdate(id, { ...data }, { new: true })
        .lean();
      if (!row) throw new Error(`Picking ${id} not found`);
      return mapPicking(toPlainRecord(row));
    },
    async updateMove(id, data) {
      const row = await moves()
        .findByIdAndUpdate(id, { ...data }, { new: true })
        .lean();
      if (!row) throw new Error(`Move ${id} not found`);
      return mapMove(toPlainRecord(row));
    },
    async findLocation(id) {
      const row = await locations().findById(id).lean();
      return row ? mapLocation(toPlainRecord(row)) : null;
    },
    async findProduct(id) {
      if (!products) return null;
      const row = await products().findById(id).lean();
      if (!row) return null;
      const r = toPlainRecord(row);
      return {
        id: String(r.id),
        name: r.name as string | undefined,
        standardCost: r.standardCost as number | undefined,
      };
    },
    async findQuant(keys) {
      const filter: Record<string, unknown> = {
        productId: keys.productId,
        locationId: keys.locationId,
      };
      if (keys.companyId != null) filter.companyId = keys.companyId;
      if (keys.lotId != null) filter.lotId = keys.lotId;
      else filter.$or = [{ lotId: null }, { lotId: { $exists: false } }, { lotId: '' }];
      const row = await quants().findOne(filter).lean();
      return row ? mapQuant(toPlainRecord(row)) : null;
    },
    async upsertQuant(quant) {
      const filter: Record<string, unknown> = {
        productId: quant.productId,
        locationId: quant.locationId,
      };
      if (quant.companyId != null) filter.companyId = quant.companyId;
      if (quant.lotId != null) filter.lotId = quant.lotId;
      else filter.$or = [{ lotId: null }, { lotId: { $exists: false } }, { lotId: '' }];

      const row = await quants()
        .findOneAndUpdate(
          filter,
          {
            $set: {
              quantity: quant.quantity,
              reservedQuantity: quant.reservedQuantity ?? 0,
              updatedAt: quant.updatedAt ?? new Date(),
              ...(quant.companyId != null ? { companyId: quant.companyId } : {}),
              ...(quant.lotId != null ? { lotId: quant.lotId } : {}),
            },
            $setOnInsert: {
              productId: quant.productId,
              locationId: quant.locationId,
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        )
        .lean();
      return mapQuant(toPlainRecord(row));
    },
    async createPicking(data) {
      const row = await pickings().create({ ...data });
      return mapPicking(toPlainRecord(row));
    },
    async createMove(data) {
      const row = await moves().create({ ...data });
      return mapMove(toPlainRecord(row));
    },
    runInTransaction: conn.startSession
      ? async (fn) => {
          const session = await conn.startSession!();
          try {
            let result!: Awaited<ReturnType<typeof fn>>;
            await session.withTransaction(async () => {
              result = await fn();
            });
            return result;
          } finally {
            await session.endSession();
          }
        }
      : passthroughTransaction,
  };
}
