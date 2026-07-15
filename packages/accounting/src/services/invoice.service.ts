import type {
  AccountInvoice,
  AccountInvoiceLine,
  AccountMove,
  AccountPayment,
  AccountingStore,
} from '../models/types.js';
import { AccountMoveService } from './account-move.service.js';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface InvoiceStore extends AccountingStore {
  findInvoice(id: string): Promise<AccountInvoice | null>;
  findInvoiceLines(invoiceId: string): Promise<AccountInvoiceLine[]>;
  updateInvoice(id: string, data: Partial<AccountInvoice>): Promise<AccountInvoice>;
  createInvoice(data: AccountInvoice): Promise<AccountInvoice>;
  createInvoiceLine(data: AccountInvoiceLine): Promise<AccountInvoiceLine>;
  findPayment?(id: string): Promise<AccountPayment | null>;
  updatePayment?(id: string, data: Partial<AccountPayment>): Promise<AccountPayment>;
  createPayment?(data: AccountPayment): Promise<AccountPayment>;
}

export interface ProductAccounts {
  incomeAccountId?: string;
  expenseAccountId?: string;
  stockAccountId?: string;
  stockInputAccountId?: string;
  stockOutputAccountId?: string;
  listPrice?: number;
  standardCost?: number;
  name?: string;
}

/**
 * Invoice posting and payment residual updates.
 */
export class InvoiceService {
  private readonly moves: AccountMoveService;

  constructor(
    private readonly store: InvoiceStore,
    private readonly resolveProductAccounts: (
      productId: string,
    ) => Promise<ProductAccounts | null>,
    private readonly defaults: {
      receivableAccountId: string;
      payableAccountId: string;
      incomeAccountId: string;
      expenseAccountId: string;
    },
  ) {
    this.moves = new AccountMoveService(store);
  }

  async postInvoice(invoiceId: string): Promise<{ invoice: AccountInvoice; move: AccountMove }> {
    const invoice = await this.requireInvoice(invoiceId);
    if (invoice.state === 'posted' || invoice.state === 'paid') {
      if (invoice.moveId) {
        const move = await this.store.findMove(invoice.moveId);
        if (move) return { invoice, move };
      }
      throw new Error('Invoice already posted without journal entry');
    }
    if (invoice.state === 'cancel') {
      throw new Error('Cannot post a cancelled invoice');
    }

    const lines = await this.store.findInvoiceLines(invoiceId);
    if (lines.length === 0) throw new Error('Invoice has no lines');

    const isOutbound =
      invoice.moveType === 'out_invoice' || invoice.moveType === 'out_refund';
    const moveLines: Array<{
      accountId: string;
      name?: string;
      amount: number;
      productId?: string;
      partnerId?: string;
    }> = [];

    let untaxed = 0;
    for (const line of lines) {
      const qty = Number(line.quantity ?? 1);
      const price = Number(line.priceUnit ?? 0);
      const amount = round2(line.subtotal ?? qty * price);
      untaxed += amount;
      let accountId = line.accountId;
      if (!accountId && line.productId) {
        const prod = await this.resolveProductAccounts(line.productId);
        accountId = isOutbound
          ? prod?.incomeAccountId ?? this.defaults.incomeAccountId
          : prod?.expenseAccountId ?? this.defaults.expenseAccountId;
      }
      if (!accountId) {
        accountId = isOutbound
          ? this.defaults.incomeAccountId
          : this.defaults.expenseAccountId;
      }
      moveLines.push({
        accountId,
        name: line.name,
        amount,
        productId: line.productId,
        partnerId: invoice.partnerId,
      });
    }

    const tax = round2(Number(invoice.amountTax ?? 0));
    const total = round2(untaxed + tax);
    const receivableOrPayable = isOutbound
      ? this.defaults.receivableAccountId
      : this.defaults.payableAccountId;

    const move = await this.moves.createFromInvoice(
      { ...invoice, amountUntaxed: untaxed, amountTax: tax, amountTotal: total },
      moveLines,
      receivableOrPayable,
    );

    const updated = await this.store.updateInvoice(invoiceId, {
      state: 'posted',
      moveId: String(move.id),
      amountUntaxed: untaxed,
      amountTax: tax,
      amountTotal: total,
      amountResidual: total,
    });
    return { invoice: updated, move };
  }

  /**
   * Apply a payment against an invoice residual (simple open-amount).
   */
  async postPayment(paymentId: string): Promise<AccountPayment> {
    if (!this.store.findPayment || !this.store.updatePayment) {
      throw new Error('Store does not support payments');
    }
    const payment = await this.store.findPayment(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);
    if (payment.state === 'posted') return payment;

    const amount = round2(Number(payment.amount ?? 0));
    if (amount <= 0) throw new Error('Payment amount must be positive');

    if (payment.invoiceId) {
      const invoice = await this.requireInvoice(payment.invoiceId);
      const residual = round2(Number(invoice.amountResidual ?? invoice.amountTotal ?? 0));
      if (amount - residual > 0.001) {
        throw new Error(`Payment ${amount} exceeds residual ${residual}`);
      }
      const nextResidual = round2(residual - amount);
      await this.store.updateInvoice(String(invoice.id), {
        amountResidual: nextResidual,
        state: nextResidual <= 0.001 ? 'paid' : invoice.state ?? 'posted',
      });
    }

    return this.store.updatePayment(paymentId, { state: 'posted' });
  }

  /**
   * Create customer invoice lines from a done delivery picking.
   */
  async createInvoiceFromPicking(input: {
    companyId?: string;
    pickingId: string;
    pickingName?: string;
    partnerId: string;
    journalId: string;
    moves: Array<{
      productId: string;
      quantity: number;
      name?: string;
      priceUnit?: number;
    }>;
  }): Promise<AccountInvoice> {
    const invoice = await this.store.createInvoice({
      companyId: input.companyId,
      name: input.pickingName ? `INV/${input.pickingName}` : undefined,
      partnerId: input.partnerId,
      moveType: 'out_invoice',
      invoiceDate: new Date().toISOString().slice(0, 10),
      state: 'draft',
      journalId: input.journalId,
      narrations: `From delivery ${input.pickingId}`,
    });

    let untaxed = 0;
    for (const move of input.moves) {
      const prod = await this.resolveProductAccounts(move.productId);
      const price = Number(move.priceUnit ?? prod?.listPrice ?? 0);
      const qty = Number(move.quantity);
      const subtotal = round2(qty * price);
      untaxed += subtotal;
      await this.store.createInvoiceLine({
        companyId: input.companyId,
        invoiceId: String(invoice.id),
        productId: move.productId,
        name: move.name ?? prod?.name ?? move.productId,
        quantity: qty,
        priceUnit: price,
        accountId: prod?.incomeAccountId ?? this.defaults.incomeAccountId,
        subtotal,
      });
    }

    return this.store.updateInvoice(String(invoice.id), {
      amountUntaxed: untaxed,
      amountTax: 0,
      amountTotal: untaxed,
      amountResidual: untaxed,
    });
  }

  /**
   * Create vendor bill from a done receipt picking.
   */
  async createBillFromPicking(input: {
    companyId?: string;
    pickingId: string;
    pickingName?: string;
    partnerId: string;
    journalId: string;
    moves: Array<{
      productId: string;
      quantity: number;
      name?: string;
      priceUnit?: number;
    }>;
  }): Promise<AccountInvoice> {
    const invoice = await this.store.createInvoice({
      companyId: input.companyId,
      name: input.pickingName ? `BILL/${input.pickingName}` : undefined,
      partnerId: input.partnerId,
      moveType: 'in_invoice',
      invoiceDate: new Date().toISOString().slice(0, 10),
      state: 'draft',
      journalId: input.journalId,
      narrations: `From receipt ${input.pickingId}`,
    });

    let untaxed = 0;
    for (const move of input.moves) {
      const prod = await this.resolveProductAccounts(move.productId);
      const price = Number(move.priceUnit ?? prod?.standardCost ?? 0);
      const qty = Number(move.quantity);
      const subtotal = round2(qty * price);
      untaxed += subtotal;
      await this.store.createInvoiceLine({
        companyId: input.companyId,
        invoiceId: String(invoice.id),
        productId: move.productId,
        name: move.name ?? prod?.name ?? move.productId,
        quantity: qty,
        priceUnit: price,
        accountId: prod?.expenseAccountId ?? this.defaults.expenseAccountId,
        subtotal,
      });
    }

    return this.store.updateInvoice(String(invoice.id), {
      amountUntaxed: untaxed,
      amountTax: 0,
      amountTotal: untaxed,
      amountResidual: untaxed,
    });
  }

  private async requireInvoice(id: string): Promise<AccountInvoice> {
    const invoice = await this.store.findInvoice(id);
    if (!invoice) throw new Error(`Invoice ${id} not found`);
    return invoice;
  }
}
