import {
  modelRefKey,
  passthroughTransaction,
  toPlainRecord,
} from '@nodeweaver/persistence';
import type {
  AccountAccount,
  AccountInvoice,
  AccountInvoiceLine,
  AccountJournal,
  AccountMove,
  AccountMoveLine,
  AccountPayment,
} from '../models/types.js';
import type { AccountingStoreModelMap, AccountingStoreWithTx } from './types.js';

type MongooseModel = {
  findById: (id: string) => { lean: () => Promise<unknown> };
  find: (filter: Record<string, unknown>) => {
    lean: () => Promise<unknown[]>;
  };
  findByIdAndUpdate: (
    id: string,
    data: Record<string, unknown>,
    opts: { new: boolean },
  ) => { lean: () => Promise<unknown> };
  create: (data: Record<string, unknown>) => Promise<unknown>;
};

type MongooseConnection = {
  model: (name: string) => MongooseModel;
  models?: Record<string, MongooseModel>;
  startSession?: () => Promise<{
    withTransaction: (fn: () => Promise<void>) => Promise<void>;
    endSession: () => Promise<void>;
  }>;
};

function resolveModel(
  conn: MongooseConnection,
  ref: AccountingStoreModelMap[keyof AccountingStoreModelMap],
): MongooseModel {
  const key = modelRefKey(ref as NonNullable<typeof ref>);
  if (conn.models?.[key]) return conn.models[key]!;
  return conn.model(key);
}

function as<T>(value: unknown): T {
  return toPlainRecord(value) as unknown as T;
}

export function createMongooseAccountingStore(
  dataSource: unknown,
  models: AccountingStoreModelMap,
): AccountingStoreWithTx {
  const conn = dataSource as MongooseConnection;
  const moves = () => resolveModel(conn, models.move);
  const lines = () => resolveModel(conn, models.moveLine);
  const invoices = models.invoice
    ? () => resolveModel(conn, models.invoice!)
    : null;
  const invoiceLines = models.invoiceLine
    ? () => resolveModel(conn, models.invoiceLine!)
    : null;
  const payments = models.payment
    ? () => resolveModel(conn, models.payment!)
    : null;
  const journals = models.journal
    ? () => resolveModel(conn, models.journal!)
    : null;
  const accounts = models.account
    ? () => resolveModel(conn, models.account!)
    : null;

  return {
    async findMove(id) {
      const row = await moves().findById(id).lean();
      return row ? as<AccountMove>(row) : null;
    },
    async findMoveLines(moveId) {
      const rows = await lines().find({ moveId }).lean();
      return rows.map((r) => as<AccountMoveLine>(r));
    },
    async updateMove(id, data) {
      const row = await moves()
        .findByIdAndUpdate(id, { ...data }, { new: true })
        .lean();
      if (!row) throw new Error(`Journal entry ${id} not found`);
      return as<AccountMove>(row);
    },
    async updateMoveLine(id, data) {
      const row = await lines()
        .findByIdAndUpdate(id, { ...data }, { new: true })
        .lean();
      if (!row) throw new Error(`Journal item ${id} not found`);
      return as<AccountMoveLine>(row);
    },
    async createMove(data) {
      return as<AccountMove>(await moves().create({ ...data }));
    },
    async createMoveLine(data) {
      return as<AccountMoveLine>(await lines().create({ ...data }));
    },
    async findInvoice(id) {
      if (!invoices) return null;
      const row = await invoices().findById(id).lean();
      return row ? as<AccountInvoice>(row) : null;
    },
    async findInvoiceLines(invoiceId) {
      if (!invoiceLines) return [];
      const rows = await invoiceLines().find({ invoiceId }).lean();
      return rows.map((r) => as<AccountInvoiceLine>(r));
    },
    async updateInvoice(id, data) {
      if (!invoices) throw new Error('Invoice model not configured');
      const row = await invoices()
        .findByIdAndUpdate(id, { ...data }, { new: true })
        .lean();
      if (!row) throw new Error(`Invoice ${id} not found`);
      return as<AccountInvoice>(row);
    },
    async createInvoice(data) {
      if (!invoices) throw new Error('Invoice model not configured');
      return as<AccountInvoice>(await invoices().create({ ...data }));
    },
    async createInvoiceLine(data) {
      if (!invoiceLines) throw new Error('Invoice line model not configured');
      return as<AccountInvoiceLine>(await invoiceLines().create({ ...data }));
    },
    async findPayment(id) {
      if (!payments) return null;
      const row = await payments().findById(id).lean();
      return row ? as<AccountPayment>(row) : null;
    },
    async updatePayment(id, data) {
      if (!payments) throw new Error('Payment model not configured');
      const row = await payments()
        .findByIdAndUpdate(id, { ...data }, { new: true })
        .lean();
      if (!row) throw new Error(`Payment ${id} not found`);
      return as<AccountPayment>(row);
    },
    async createPayment(data) {
      if (!payments) throw new Error('Payment model not configured');
      return as<AccountPayment>(await payments().create({ ...data }));
    },
    async findJournal(id) {
      if (!journals) return null;
      const row = await journals().findById(id).lean();
      return row ? as<AccountJournal>(row) : null;
    },
    async findAccount(id) {
      if (!accounts) return null;
      const row = await accounts().findById(id).lean();
      return row ? as<AccountAccount>(row) : null;
    },
    async listPostedLines(filters = {}) {
      const postedFilter: Record<string, unknown> = { state: 'posted' };
      if (filters.companyId) postedFilter.companyId = filters.companyId;
      const posted = await moves().find(postedFilter).lean();
      const moveIds = new Set(posted.map((m) => String(toPlainRecord(m).id)));
      const lineFilter: Record<string, unknown> = {};
      if (filters.accountId) lineFilter.accountId = filters.accountId;
      if (filters.companyId) lineFilter.companyId = filters.companyId;
      const all = await lines().find(lineFilter).lean();
      return all
        .map((l) => as<AccountMoveLine>(l))
        .filter((l) => moveIds.has(String(l.moveId)));
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
