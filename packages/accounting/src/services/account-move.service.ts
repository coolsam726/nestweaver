import type {
  AccountInvoice,
  AccountMove,
  AccountMoveLine,
  AccountingStore,
} from '../models/types.js';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Journal entry posting — draft/post/reverse with debit=credit invariant.
 */
export class AccountMoveService {
  constructor(private readonly store: AccountingStore) {}

  async post(moveId: string): Promise<AccountMove> {
    const move = await this.requireMove(moveId);
    if (move.state === 'posted') return move;
    if (move.state === 'cancel') {
      throw new Error('Cannot post a cancelled entry');
    }
    const lines = await this.store.findMoveLines(moveId);
    if (lines.length < 2) {
      throw new Error('Journal entry needs at least two lines');
    }
    const debit = round2(lines.reduce((s, l) => s + Number(l.debit ?? 0), 0));
    const credit = round2(lines.reduce((s, l) => s + Number(l.credit ?? 0), 0));
    if (Math.abs(debit - credit) > 0.001) {
      throw new Error(`Entry is unbalanced (debit ${debit} ≠ credit ${credit})`);
    }
    return this.store.updateMove(moveId, { state: 'posted' });
  }

  async reverse(moveId: string, opts?: { date?: string; ref?: string }): Promise<AccountMove> {
    const move = await this.requireMove(moveId);
    if (move.state !== 'posted') {
      throw new Error('Only posted entries can be reversed');
    }
    const lines = await this.store.findMoveLines(moveId);
    const reversal = await this.store.createMove({
      companyId: move.companyId,
      name: undefined,
      ref: opts?.ref ?? `REV:${move.name ?? moveId}`,
      journalId: move.journalId,
      date: opts?.date ?? new Date().toISOString().slice(0, 10),
      state: 'draft',
      partnerId: move.partnerId,
      sourceModel: 'account.moves',
      sourceId: moveId,
    });
    for (const line of lines) {
      await this.store.createMoveLine({
        companyId: move.companyId,
        moveId: String(reversal.id),
        accountId: line.accountId,
        partnerId: line.partnerId,
        name: line.name ? `Reversal: ${line.name}` : 'Reversal',
        debit: Number(line.credit ?? 0),
        credit: Number(line.debit ?? 0),
        productId: line.productId,
        taxId: line.taxId,
      });
    }
    return this.post(String(reversal.id));
  }

  async cancelDraft(moveId: string): Promise<AccountMove> {
    const move = await this.requireMove(moveId);
    if (move.state !== 'draft') {
      throw new Error('Only draft entries can be cancelled');
    }
    return this.store.updateMove(moveId, { state: 'cancel' });
  }

  /**
   * Build a balanced journal entry from invoice header + lines (simple tax-as-line).
   */
  async createFromInvoice(
    invoice: AccountInvoice,
    lines: Array<{
      accountId: string;
      name?: string;
      amount: number;
      taxAmount?: number;
      taxAccountId?: string;
      partnerId?: string;
      productId?: string;
    }>,
    receivableOrPayableAccountId: string,
  ): Promise<AccountMove> {
    const isOutbound =
      invoice.moveType === 'out_invoice' || invoice.moveType === 'out_refund';
    const sign =
      invoice.moveType === 'out_refund' || invoice.moveType === 'in_refund' ? -1 : 1;

    const move = await this.store.createMove({
      companyId: invoice.companyId,
      journalId: invoice.journalId,
      date: invoice.invoiceDate ?? new Date().toISOString().slice(0, 10),
      state: 'draft',
      partnerId: invoice.partnerId,
      sourceModel: 'account.invoices',
      sourceId: String(invoice.id),
      ref: invoice.name,
    });

    let untaxed = 0;
    let tax = 0;
    for (const line of lines) {
      const amount = round2(Math.abs(line.amount) * sign);
      untaxed += Math.abs(line.amount);
      if (isOutbound) {
        await this.store.createMoveLine({
          companyId: invoice.companyId,
          moveId: String(move.id),
          accountId: line.accountId,
          partnerId: line.partnerId ?? invoice.partnerId,
          name: line.name,
          productId: line.productId,
          credit: amount > 0 ? amount : 0,
          debit: amount < 0 ? Math.abs(amount) : 0,
        });
      } else {
        await this.store.createMoveLine({
          companyId: invoice.companyId,
          moveId: String(move.id),
          accountId: line.accountId,
          partnerId: line.partnerId ?? invoice.partnerId,
          name: line.name,
          productId: line.productId,
          debit: amount > 0 ? amount : 0,
          credit: amount < 0 ? Math.abs(amount) : 0,
        });
      }
      if (line.taxAmount && line.taxAccountId) {
        const t = round2(Math.abs(line.taxAmount) * sign);
        tax += Math.abs(line.taxAmount);
        if (isOutbound) {
          await this.store.createMoveLine({
            companyId: invoice.companyId,
            moveId: String(move.id),
            accountId: line.taxAccountId,
            partnerId: invoice.partnerId,
            name: `Tax: ${line.name ?? ''}`,
            credit: t > 0 ? t : 0,
            debit: t < 0 ? Math.abs(t) : 0,
          });
        } else {
          await this.store.createMoveLine({
            companyId: invoice.companyId,
            moveId: String(move.id),
            accountId: line.taxAccountId,
            partnerId: invoice.partnerId,
            name: `Tax: ${line.name ?? ''}`,
            debit: t > 0 ? t : 0,
            credit: t < 0 ? Math.abs(t) : 0,
          });
        }
      }
    }

    const total = round2(untaxed + tax) * (sign < 0 ? -1 : 1);
    const absTotal = round2(Math.abs(total));
    if (isOutbound) {
      await this.store.createMoveLine({
        companyId: invoice.companyId,
        moveId: String(move.id),
        accountId: receivableOrPayableAccountId,
        partnerId: invoice.partnerId,
        name: invoice.name ?? 'Receivable',
        debit: total >= 0 ? absTotal : 0,
        credit: total < 0 ? absTotal : 0,
      });
    } else {
      await this.store.createMoveLine({
        companyId: invoice.companyId,
        moveId: String(move.id),
        accountId: receivableOrPayableAccountId,
        partnerId: invoice.partnerId,
        name: invoice.name ?? 'Payable',
        credit: total >= 0 ? absTotal : 0,
        debit: total < 0 ? absTotal : 0,
      });
    }

    return this.post(String(move.id));
  }

  /**
   * Stock valuation journal (perpetual): for each move, debit destination / credit source accounts.
   * Incoming: Debit Stock, Credit Stock Input (interim)
   * Outgoing: Debit COGS / Stock Output, Credit Stock
   */
  async createStockValuationEntry(input: {
    companyId?: string;
    journalId: string;
    date?: string;
    pickingId: string;
    pickingName?: string;
    lines: Array<{
      name: string;
      amount: number;
      stockAccountId: string;
      counterpartAccountId: string;
      direction: 'in' | 'out';
    }>;
  }): Promise<AccountMove | null> {
    const valuable = input.lines.filter((l) => round2(l.amount) > 0);
    if (valuable.length === 0) return null;

    const move = await this.store.createMove({
      companyId: input.companyId,
      journalId: input.journalId,
      date: input.date ?? new Date().toISOString().slice(0, 10),
      state: 'draft',
      sourceModel: 'stock-pickings',
      sourceId: input.pickingId,
      ref: input.pickingName ?? input.pickingId,
    });

    for (const line of valuable) {
      const amount = round2(line.amount);
      if (line.direction === 'in') {
        await this.store.createMoveLine({
          companyId: input.companyId,
          moveId: String(move.id),
          accountId: line.stockAccountId,
          name: line.name,
          debit: amount,
          credit: 0,
        });
        await this.store.createMoveLine({
          companyId: input.companyId,
          moveId: String(move.id),
          accountId: line.counterpartAccountId,
          name: line.name,
          debit: 0,
          credit: amount,
        });
      } else {
        await this.store.createMoveLine({
          companyId: input.companyId,
          moveId: String(move.id),
          accountId: line.counterpartAccountId,
          name: line.name,
          debit: amount,
          credit: 0,
        });
        await this.store.createMoveLine({
          companyId: input.companyId,
          moveId: String(move.id),
          accountId: line.stockAccountId,
          name: line.name,
          debit: 0,
          credit: amount,
        });
      }
    }

    return this.post(String(move.id));
  }

  async trialBalance(companyId?: string): Promise<
    Array<{ accountId: string; debit: number; credit: number; balance: number }>
  > {
    if (!this.store.listPostedLines) {
      throw new Error('Store does not support trial balance listing');
    }
    const lines = await this.store.listPostedLines({ companyId });
    const map = new Map<string, { debit: number; credit: number }>();
    for (const line of lines) {
      const cur = map.get(line.accountId) ?? { debit: 0, credit: 0 };
      cur.debit = round2(cur.debit + Number(line.debit ?? 0));
      cur.credit = round2(cur.credit + Number(line.credit ?? 0));
      map.set(line.accountId, cur);
    }
    return [...map.entries()].map(([accountId, v]) => ({
      accountId,
      debit: v.debit,
      credit: v.credit,
      balance: round2(v.debit - v.credit),
    }));
  }

  private async requireMove(id: string): Promise<AccountMove> {
    const move = await this.store.findMove(id);
    if (!move) throw new Error(`Journal entry ${id} not found`);
    return move;
  }
}

export type { AccountMoveLine };
