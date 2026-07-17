import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AccountMoveService } from '../src/services/account-move.service.js';
import { InvoiceService } from '../src/services/invoice.service.js';
import { createStockValuationWriter } from '../src/services/stock-valuation.writer.js';
import type {
  AccountInvoice,
  AccountInvoiceLine,
  AccountMove,
  AccountMoveLine,
  AccountPayment,
} from '../src/models/types.js';
import type { InvoiceStore } from '../src/services/invoice.service.js';
import { StockMoveService } from '@nodeweaver/inventory';
import type {
  StockMove,
  StockPicking,
  StockQuant,
  StockStore,
} from '@nodeweaver/inventory';

function accountingMemory(): InvoiceStore & {
  moves: Map<string, AccountMove>;
  lines: Map<string, AccountMoveLine>;
  invoices: Map<string, AccountInvoice>;
  invoiceLines: Map<string, AccountInvoiceLine>;
  payments: Map<string, AccountPayment>;
} {
  let seq = 1;
  const moves = new Map<string, AccountMove>();
  const lines = new Map<string, AccountMoveLine>();
  const invoices = new Map<string, AccountInvoice>();
  const invoiceLines = new Map<string, AccountInvoiceLine>();
  const payments = new Map<string, AccountPayment>();
  const id = () => String(seq++);

  return {
    moves,
    lines,
    invoices,
    invoiceLines,
    payments,
    async findMove(mid) {
      return moves.get(mid) ?? null;
    },
    async findMoveLines(moveId) {
      return [...lines.values()].filter((l) => l.moveId === moveId);
    },
    async updateMove(mid, data) {
      const next = { ...moves.get(mid)!, ...data };
      moves.set(mid, next);
      return next;
    },
    async updateMoveLine(lid, data) {
      const next = { ...lines.get(lid)!, ...data };
      lines.set(lid, next);
      return next;
    },
    async createMove(data) {
      const mid = id();
      const row = { ...data, id: mid };
      moves.set(mid, row);
      return row;
    },
    async createMoveLine(data) {
      const lid = id();
      const row = { ...data, id: lid };
      lines.set(lid, row);
      return row;
    },
    async findInvoice(iid) {
      return invoices.get(iid) ?? null;
    },
    async findInvoiceLines(invoiceId) {
      return [...invoiceLines.values()].filter((l) => l.invoiceId === invoiceId);
    },
    async updateInvoice(iid, data) {
      const next = { ...invoices.get(iid)!, ...data };
      invoices.set(iid, next);
      return next;
    },
    async createInvoice(data) {
      const iid = id();
      const row = { ...data, id: iid };
      invoices.set(iid, row);
      return row;
    },
    async createInvoiceLine(data) {
      const lid = id();
      const row = { ...data, id: lid };
      invoiceLines.set(lid, row);
      return row;
    },
    async findPayment(pid) {
      return payments.get(pid) ?? null;
    },
    async updatePayment(pid, data) {
      const next = { ...payments.get(pid)!, ...data };
      payments.set(pid, next);
      return next;
    },
    async createPayment(data) {
      const pid = id();
      const row = { ...data, id: pid };
      payments.set(pid, row);
      return row;
    },
    async listPostedLines({ companyId } = {}) {
      const posted = new Set(
        [...moves.values()].filter((m) => m.state === 'posted').map((m) => String(m.id)),
      );
      return [...lines.values()].filter(
        (l) =>
          posted.has(String(l.moveId)) &&
          (companyId == null || l.companyId === companyId),
      );
    },
  };
}

describe('AccountMoveService', () => {
  it('rejects unbalanced post', async () => {
    const store = accountingMemory();
    const move = await store.createMove({ state: 'draft', journalId: 'J' });
    await store.createMoveLine({
      moveId: String(move.id),
      accountId: 'A1',
      debit: 100,
      credit: 0,
    });
    await store.createMoveLine({
      moveId: String(move.id),
      accountId: 'A2',
      debit: 0,
      credit: 40,
    });
    const svc = new AccountMoveService(store);
    await assert.rejects(() => svc.post(String(move.id)), /unbalanced/);
  });

  it('posts balanced entry and reverse mirrors lines', async () => {
    const store = accountingMemory();
    const move = await store.createMove({ state: 'draft', journalId: 'J', name: 'JE/1' });
    await store.createMoveLine({
      moveId: String(move.id),
      accountId: 'A1',
      debit: 50,
      credit: 0,
      name: 'Debit',
    });
    await store.createMoveLine({
      moveId: String(move.id),
      accountId: 'A2',
      debit: 0,
      credit: 50,
      name: 'Credit',
    });
    const svc = new AccountMoveService(store);
    const posted = await svc.post(String(move.id));
    assert.equal(posted.state, 'posted');

    const rev = await svc.reverse(String(move.id));
    assert.equal(rev.state, 'posted');
    const revLines = await store.findMoveLines(String(rev.id));
    assert.equal(revLines.length, 2);
    const debit = revLines.reduce((s, l) => s + Number(l.debit ?? 0), 0);
    const credit = revLines.reduce((s, l) => s + Number(l.credit ?? 0), 0);
    assert.equal(debit, credit);
  });
});

describe('InvoiceService', () => {
  it('posts invoice and reduces residual on payment', async () => {
    const store = accountingMemory();
    const inv = await store.createInvoice({
      partnerId: 'P',
      moveType: 'out_invoice',
      state: 'draft',
      journalId: 'SALE',
    });
    await store.createInvoiceLine({
      invoiceId: String(inv.id),
      name: 'Widget',
      quantity: 2,
      priceUnit: 25,
      accountId: 'INC',
      subtotal: 50,
    });

    const svc = new InvoiceService(
      store,
      async () => ({ incomeAccountId: 'INC', listPrice: 25 }),
      {
        receivableAccountId: 'AR',
        payableAccountId: 'AP',
        incomeAccountId: 'INC',
        expenseAccountId: 'EXP',
      },
    );
    const { invoice, move } = await svc.postInvoice(String(inv.id));
    assert.equal(invoice.state, 'posted');
    assert.equal(invoice.amountTotal, 50);
    assert.equal(move.state, 'posted');

    const pay = await store.createPayment!({
      partnerId: 'P',
      amount: 20,
      invoiceId: String(inv.id),
      state: 'draft',
      paymentType: 'inbound',
    });
    await svc.postPayment(String(pay.id));
    const after = await store.findInvoice(String(inv.id));
    assert.equal(after?.amountResidual, 30);
  });

  it('creates invoice from delivery picking', async () => {
    const store = accountingMemory();
    const svc = new InvoiceService(
      store,
      async () => ({ incomeAccountId: 'INC', listPrice: 10, name: 'Gadget' }),
      {
        receivableAccountId: 'AR',
        payableAccountId: 'AP',
        incomeAccountId: 'INC',
        expenseAccountId: 'EXP',
      },
    );
    const inv = await svc.createInvoiceFromPicking({
      pickingId: 'PICK1',
      pickingName: 'OUT/1',
      partnerId: 'CUST',
      journalId: 'SALE',
      moves: [{ productId: 'PROD', quantity: 3 }],
    });
    assert.equal(inv.amountTotal, 30);
    assert.equal(inv.moveType, 'out_invoice');
    const lines = await store.findInvoiceLines(String(inv.id));
    assert.equal(lines.length, 1);
  });
});

describe('createStockValuationWriter', () => {
  it('posts inventory journal on validate', async () => {
    const acc = accountingMemory();
    const writer = createStockValuationWriter(acc, {
      journalId: 'STJ',
      resolveProduct: async () => ({
        stockAccountId: 'STOCK',
        stockInputAccountId: 'INPUT',
        stockOutputAccountId: 'COGS',
        standardCost: 5,
        name: 'Widget',
      }),
    });

    const quants = new Map<string, StockQuant>();
    const pickings = new Map<string, StockPicking>();
    const moves = new Map<string, StockMove>();
    const key = (q: { productId: string; locationId: string; lotId?: string }) =>
      `${q.productId}|${q.locationId}|${q.lotId ?? ''}`;
    const stockStore: StockStore = {
      async findPicking(id) {
        return pickings.get(id) ?? null;
      },
      async findMovesByPicking(pickingId) {
        return [...moves.values()].filter((m) => m.pickingId === pickingId);
      },
      async updatePicking(id, data) {
        const next = { ...pickings.get(id)!, ...data };
        pickings.set(id, next);
        return next;
      },
      async updateMove(id, data) {
        const next = { ...moves.get(id)!, ...data };
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
        const next = { ...quant, id: quant.id ?? key(quant) };
        quants.set(key(quant), next);
        return next;
      },
    };

    pickings.set('P1', {
      id: 'P1',
      name: 'IN/1',
      pickingType: 'incoming',
      state: 'draft',
      companyId: 'c1',
    });
    moves.set('M1', {
      id: 'M1',
      pickingId: 'P1',
      productId: 'PROD',
      productUomQty: 4,
      locationDestId: 'STOCK',
      state: 'draft',
      priceUnit: 5,
      companyId: 'c1',
    });

    const stock = new StockMoveService(stockStore, writer);
    await stock.validate('P1');

    const posted = [...acc.moves.values()].filter((m) => m.state === 'posted');
    assert.equal(posted.length, 1);
    assert.equal(posted[0]?.sourceModel, 'stock-pickings');
    const lines = await acc.findMoveLines(String(posted[0]!.id));
    const debit = lines.reduce((s, l) => s + Number(l.debit ?? 0), 0);
    const credit = lines.reduce((s, l) => s + Number(l.credit ?? 0), 0);
    assert.equal(debit, 20);
    assert.equal(credit, 20);
  });
});
