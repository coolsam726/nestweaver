import type { ValuationJournalWriter } from '@nodeweaver/inventory';
import type { AccountingStore } from '../models/types.js';
import { AccountMoveService } from './account-move.service.js';

export interface StockValuationProductAccounts {
  stockAccountId?: string;
  stockInputAccountId?: string;
  stockOutputAccountId?: string;
  standardCost?: number;
  name?: string;
}

export interface StockValuationWriterOptions {
  journalId: string;
  /** Resolve valuation accounts for a product. Return null to skip that move. */
  resolveProduct: (
    productId: string,
  ) => Promise<StockValuationProductAccounts | null>;
  /**
   * Infer flow direction from picking type when present.
   * Incoming → stock debit / input credit; outgoing → COGS debit / stock credit.
   */
  defaultDirection?: 'in' | 'out';
}

/**
 * Bridge Wave 3: plug into `StockMoveService` as `valuationWriter` to post
 * perpetual inventory journal entries when a picking is validated.
 */
export function createStockValuationWriter(
  store: AccountingStore,
  opts: StockValuationWriterOptions,
): ValuationJournalWriter {
  const moves = new AccountMoveService(store);
  return async ({ picking, moves: stockMoves }) => {
    const lines: Array<{
      name: string;
      amount: number;
      stockAccountId: string;
      counterpartAccountId: string;
      direction: 'in' | 'out';
    }> = [];

    for (const move of stockMoves) {
      const prod = await opts.resolveProduct(move.productId);
      if (!prod?.stockAccountId) continue;
      const amount = Math.round(move.quantity * Number(move.cost ?? prod.standardCost ?? 0) * 100) / 100;
      if (amount <= 0) continue;

      let direction: 'in' | 'out' =
        opts.defaultDirection ??
        (picking.pickingType === 'outgoing'
          ? 'out'
          : picking.pickingType === 'incoming'
            ? 'in'
            : 'in');

      if (picking.pickingType === 'internal') {
        // Internal transfers: no valuation move by default.
        continue;
      }

      const counterpart =
        direction === 'in'
          ? prod.stockInputAccountId
          : prod.stockOutputAccountId;
      if (!counterpart) continue;

      lines.push({
        name: `${prod.name ?? move.productId} × ${move.quantity}`,
        amount,
        stockAccountId: prod.stockAccountId,
        counterpartAccountId: counterpart,
        direction,
      });
    }

    if (lines.length === 0) return;

    await moves.createStockValuationEntry({
      companyId: picking.companyId,
      journalId: opts.journalId,
      pickingId: String(picking.id),
      pickingName: picking.name,
      lines,
    });
  };
}
