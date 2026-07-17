import {
  coerceId,
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

type TypeOrmRepo = {
  findOne: (opts: { where: Record<string, unknown> }) => Promise<unknown>;
  find: (opts?: { where?: Record<string, unknown> }) => Promise<unknown[]>;
  create: (data: Record<string, unknown>) => unknown;
  save: (entity: unknown) => Promise<unknown>;
};

type TypeOrmDataSource = {
  getRepository: (entity: unknown) => TypeOrmRepo;
  transaction?: <T>(fn: () => Promise<T>) => Promise<T>;
};

function as<T>(value: unknown): T {
  return toPlainRecord(value) as unknown as T;
}

export function createTypeOrmAccountingStore(
  dataSource: unknown,
  models: AccountingStoreModelMap,
): AccountingStoreWithTx {
  const ds = dataSource as TypeOrmDataSource;
  const moves = () => ds.getRepository(models.move);
  const lines = () => ds.getRepository(models.moveLine);
  const invoices = models.invoice ? () => ds.getRepository(models.invoice!) : null;
  const invoiceLines = models.invoiceLine
    ? () => ds.getRepository(models.invoiceLine!)
    : null;
  const payments = models.payment ? () => ds.getRepository(models.payment!) : null;
  const journals = models.journal ? () => ds.getRepository(models.journal!) : null;
  const accounts = models.account ? () => ds.getRepository(models.account!) : null;

  const store: AccountingStoreWithTx = {
    async findMove(id) {
      const row = await moves().findOne({ where: { id: coerceId(id) } });
      return row ? as<AccountMove>(row) : null;
    },
    async findMoveLines(moveId) {
      const rows = await lines().find({ where: { moveId: String(moveId) } });
      if (rows.length === 0 && /^\d+$/.test(moveId)) {
        const again = await lines().find({ where: { moveId: coerceId(moveId) } });
        return again.map((r) => as<AccountMoveLine>(r));
      }
      return rows.map((r) => as<AccountMoveLine>(r));
    },
    async updateMove(id, data) {
      const repo = moves();
      const existing = await repo.findOne({ where: { id: coerceId(id) } });
      if (!existing) throw new Error(`Journal entry ${id} not found`);
      return as<AccountMove>(
        await repo.save({ ...(existing as object), ...data, id: coerceId(id) }),
      );
    },
    async updateMoveLine(id, data) {
      const repo = lines();
      const existing = await repo.findOne({ where: { id: coerceId(id) } });
      if (!existing) throw new Error(`Journal item ${id} not found`);
      return as<AccountMoveLine>(
        await repo.save({ ...(existing as object), ...data, id: coerceId(id) }),
      );
    },
    async createMove(data) {
      const created = moves().create({ ...data } as Record<string, unknown>);
      return as<AccountMove>(await moves().save(created));
    },
    async createMoveLine(data) {
      const created = lines().create({ ...data } as Record<string, unknown>);
      return as<AccountMoveLine>(await lines().save(created));
    },
    async findInvoice(id) {
      if (!invoices) return null;
      const row = await invoices().findOne({ where: { id: coerceId(id) } });
      return row ? as<AccountInvoice>(row) : null;
    },
    async findInvoiceLines(invoiceId) {
      if (!invoiceLines) return [];
      const rows = await invoiceLines().find({
        where: { invoiceId: String(invoiceId) },
      });
      return rows.map((r) => as<AccountInvoiceLine>(r));
    },
    async updateInvoice(id, data) {
      if (!invoices) throw new Error('Invoice model not configured');
      const repo = invoices();
      const existing = await repo.findOne({ where: { id: coerceId(id) } });
      if (!existing) throw new Error(`Invoice ${id} not found`);
      return as<AccountInvoice>(
        await repo.save({ ...(existing as object), ...data, id: coerceId(id) }),
      );
    },
    async createInvoice(data) {
      if (!invoices) throw new Error('Invoice model not configured');
      const created = invoices().create({ ...data } as Record<string, unknown>);
      return as<AccountInvoice>(await invoices().save(created));
    },
    async createInvoiceLine(data) {
      if (!invoiceLines) throw new Error('Invoice line model not configured');
      const created = invoiceLines().create({
        ...data,
      } as Record<string, unknown>);
      return as<AccountInvoiceLine>(await invoiceLines().save(created));
    },
    async findPayment(id) {
      if (!payments) return null;
      const row = await payments().findOne({ where: { id: coerceId(id) } });
      return row ? as<AccountPayment>(row) : null;
    },
    async updatePayment(id, data) {
      if (!payments) throw new Error('Payment model not configured');
      const repo = payments();
      const existing = await repo.findOne({ where: { id: coerceId(id) } });
      if (!existing) throw new Error(`Payment ${id} not found`);
      return as<AccountPayment>(
        await repo.save({ ...(existing as object), ...data, id: coerceId(id) }),
      );
    },
    async createPayment(data) {
      if (!payments) throw new Error('Payment model not configured');
      const created = payments().create({ ...data } as Record<string, unknown>);
      return as<AccountPayment>(await payments().save(created));
    },
    async findJournal(id) {
      if (!journals) return null;
      const row = await journals().findOne({ where: { id: coerceId(id) } });
      return row ? as<AccountJournal>(row) : null;
    },
    async findAccount(id) {
      if (!accounts) return null;
      const row = await accounts().findOne({ where: { id: coerceId(id) } });
      return row ? as<AccountAccount>(row) : null;
    },
    async listPostedLines(filters = {}) {
      const posted = await moves().find({ where: { state: 'posted' } });
      const moveIds = new Set(
        posted
          .map((m) => toPlainRecord(m))
          .filter((m) => !filters.companyId || m.companyId === filters.companyId)
          .map((m) => String(m.id)),
      );
      const allLines = await lines().find();
      return allLines
        .map((l) => as<AccountMoveLine>(l))
        .filter(
          (l) =>
            moveIds.has(String(l.moveId)) &&
            (!filters.accountId || l.accountId === filters.accountId) &&
            (!filters.companyId || l.companyId === filters.companyId),
        );
    },
    runInTransaction: ds.transaction
      ? async (fn) => ds.transaction!(fn)
      : passthroughTransaction,
  };

  return store;
}
