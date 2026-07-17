import type {
  StockMove,
  StockPicking,
  StockQuant,
  StockStore,
  ValuationJournalWriter,
} from '../models/types.js';

function quantKey(q: {
  productId: string;
  locationId: string;
  lotId?: string;
}): string {
  return `${q.productId}|${q.locationId}|${q.lotId ?? ''}`;
}

/**
 * Apply stock move quantity deltas to quants (Odoo-inspired validate).
 * Source locations with usage `supplier` / `customer` still track quants for simplicity
 * (virtual stock) — apps may use dedicated virtual locations.
 */
export class StockMoveService {
  constructor(
    private readonly store: StockStore,
    private readonly valuationWriter?: ValuationJournalWriter,
  ) {}

  async confirm(pickingId: string): Promise<StockPicking> {
    const picking = await this.requirePicking(pickingId);
    if (picking.state === 'done' || picking.state === 'cancel') {
      throw new Error(`Cannot confirm picking in state ${picking.state}`);
    }
    const moves = await this.store.findMovesByPicking(pickingId);
    for (const move of moves) {
      await this.store.updateMove(String(move.id), { state: 'confirmed' });
    }
    return this.store.updatePicking(pickingId, { state: 'confirmed' });
  }

  async assign(pickingId: string): Promise<StockPicking> {
    const picking = await this.requirePicking(pickingId);
    if (picking.state === 'draft') {
      await this.confirm(pickingId);
    }
    const moves = await this.store.findMovesByPicking(pickingId);
    for (const move of moves) {
      const qty = Number(move.productUomQty ?? 0);
      if (qty <= 0) continue;
      if (move.locationId) {
        const location = await this.store.findLocation(move.locationId);
        // Only reserve / availability-check stock from internal locations.
        const reserve = (location?.usage ?? 'internal') === 'internal';
        if (reserve) {
          const quant = await this.store.findQuant({
            companyId: picking.companyId,
            productId: move.productId,
            locationId: move.locationId,
            lotId: move.lotId,
          });
          const available =
            Number(quant?.quantity ?? 0) - Number(quant?.reservedQuantity ?? 0);
          if (available + 1e-9 < qty) {
            throw new Error(
              `Not enough stock for product ${move.productId} at location ${move.locationId} (need ${qty}, available ${available})`,
            );
          }
          if (quant) {
            await this.store.upsertQuant({
              ...quant,
              reservedQuantity: Number(quant.reservedQuantity ?? 0) + qty,
            });
          }
        }
      }
      await this.store.updateMove(String(move.id), { state: 'assigned' });
    }
    return this.store.updatePicking(pickingId, { state: 'assigned' });
  }

  async validate(pickingId: string): Promise<StockPicking> {
    const picking = await this.requirePicking(pickingId);
    if (picking.state === 'done') return picking;
    if (picking.state === 'cancel') {
      throw new Error('Cannot validate a cancelled picking');
    }
    if (picking.state === 'draft') {
      await this.confirm(pickingId);
    }

    const moves = await this.store.findMovesByPicking(pickingId);
    if (moves.length === 0) {
      throw new Error('Picking has no moves');
    }

    const valued: Array<StockMove & { quantity: number; cost: number }> = [];

    for (const move of moves) {
      const qty = Number(move.quantityDone ?? move.productUomQty ?? 0);
      if (qty <= 0) {
        throw new Error(`Move ${move.id ?? move.productId} has no quantity`);
      }

      if (move.locationId) {
        await this.applyDelta({
          companyId: picking.companyId,
          productId: move.productId,
          locationId: move.locationId,
          lotId: move.lotId,
          delta: -qty,
          releaseReservation: qty,
        });
      }
      if (move.locationDestId) {
        await this.applyDelta({
          companyId: picking.companyId,
          productId: move.productId,
          locationId: move.locationDestId,
          lotId: move.lotId,
          delta: qty,
        });
      }

      let cost = Number(move.priceUnit ?? 0);
      if (!cost && this.store.findProduct) {
        const product = await this.store.findProduct(move.productId);
        cost = Number(product?.standardCost ?? 0);
      }
      valued.push({ ...move, quantity: qty, cost });
      await this.store.updateMove(String(move.id), {
        state: 'done',
        quantityDone: qty,
        priceUnit: cost,
      });
    }

    const done = await this.store.updatePicking(pickingId, { state: 'done' });
    if (this.valuationWriter) {
      await this.valuationWriter({ picking: done, moves: valued });
    }
    return done;
  }

  async cancel(pickingId: string): Promise<StockPicking> {
    const picking = await this.requirePicking(pickingId);
    if (picking.state === 'done') {
      throw new Error('Cannot cancel a done picking — create a return instead');
    }
    const moves = await this.store.findMovesByPicking(pickingId);
    for (const move of moves) {
      if (move.state === 'assigned' && move.locationId) {
        const qty = Number(move.productUomQty ?? 0);
        const quant = await this.store.findQuant({
          companyId: picking.companyId,
          productId: move.productId,
          locationId: move.locationId,
          lotId: move.lotId,
        });
        if (quant) {
          await this.store.upsertQuant({
            ...quant,
            reservedQuantity: Math.max(
              0,
              Number(quant.reservedQuantity ?? 0) - qty,
            ),
          });
        }
      }
      await this.store.updateMove(String(move.id), { state: 'cancel' });
    }
    return this.store.updatePicking(pickingId, { state: 'cancel' });
  }

  /**
   * Inventory adjustment: set on-hand at a location to counted qty via a synthetic internal move.
   */
  async applyAdjustment(input: {
    companyId?: string;
    locationId: string;
    productId: string;
    countedQty: number;
    lotId?: string;
  }): Promise<StockQuant> {
    const existing = await this.store.findQuant({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      lotId: input.lotId,
    });
    const current = Number(existing?.quantity ?? 0);
    const delta = Number(input.countedQty) - current;
    return this.applyDelta({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      lotId: input.lotId,
      delta,
    });
  }

  private async applyDelta(input: {
    companyId?: string;
    productId: string;
    locationId: string;
    lotId?: string;
    delta: number;
    releaseReservation?: number;
  }): Promise<StockQuant> {
    const existing = await this.store.findQuant({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      lotId: input.lotId,
    });
    const quantity = Number(existing?.quantity ?? 0) + input.delta;
    if (quantity < -1e-9) {
      throw new Error(
        `Insufficient quantity for ${quantKey(input)} (would become ${quantity})`,
      );
    }
    let reserved = Number(existing?.reservedQuantity ?? 0);
    if (input.releaseReservation) {
      reserved = Math.max(0, reserved - input.releaseReservation);
    }
    return this.store.upsertQuant({
      id: existing?.id,
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      lotId: input.lotId,
      quantity: Math.max(0, quantity),
      reservedQuantity: reserved,
      updatedAt: new Date(),
    });
  }

  private async requirePicking(id: string): Promise<StockPicking> {
    const picking = await this.store.findPicking(id);
    if (!picking) throw new Error(`Picking ${id} not found`);
    return picking;
  }
}
