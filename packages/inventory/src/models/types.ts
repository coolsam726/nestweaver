export type LocationUsage =
  | 'supplier'
  | 'customer'
  | 'internal'
  | 'inventory'
  | 'production'
  | 'transit';

export type PickingType = 'incoming' | 'outgoing' | 'internal';

export type MoveState =
  | 'draft'
  | 'confirmed'
  | 'assigned'
  | 'done'
  | 'cancel';

export interface StockWarehouse {
  id?: string;
  companyId?: string;
  name: string;
  code?: string;
  lotStockLocationId?: string;
  inputLocationId?: string;
  outputLocationId?: string;
  scrapLocationId?: string;
  active?: boolean;
  createdAt?: Date;
}

export interface StockLocation {
  id?: string;
  companyId?: string;
  name: string;
  completeName?: string;
  usage?: LocationUsage;
  warehouseId?: string;
  parentId?: string;
  active?: boolean;
  createdAt?: Date;
}

export interface StockQuant {
  id?: string;
  companyId?: string;
  productId: string;
  locationId: string;
  lotId?: string;
  quantity: number;
  reservedQuantity?: number;
  updatedAt?: Date;
}

export interface StockLot {
  id?: string;
  companyId?: string;
  name: string;
  productId: string;
  createdAt?: Date;
}

export interface StockMove {
  id?: string;
  companyId?: string;
  pickingId?: string;
  name?: string;
  productId: string;
  productUomQty: number;
  quantityDone?: number;
  locationId?: string;
  locationDestId?: string;
  lotId?: string;
  state?: MoveState;
  /** Unit cost used for valuation (Wave 3). */
  priceUnit?: number;
}

export interface StockPicking {
  id?: string;
  companyId?: string;
  name?: string;
  pickingType?: PickingType;
  partnerId?: string;
  locationId?: string;
  locationDestId?: string;
  scheduledDate?: Date;
  state?: MoveState;
  origin?: string;
  moveIds?: string[];
  note?: string;
  createdAt?: Date;
}

export interface StockAdjustment {
  id?: string;
  companyId?: string;
  name?: string;
  locationId?: string;
  productId?: string;
  theoreticalQty?: number;
  countedQty?: number;
  state?: MoveState;
  createdAt?: Date;
}

/** Persistence port used by {@link StockMoveService}. */
export interface StockStore {
  findPicking(id: string): Promise<StockPicking | null>;
  findMovesByPicking(pickingId: string): Promise<StockMove[]>;
  updatePicking(id: string, data: Partial<StockPicking>): Promise<StockPicking>;
  updateMove(id: string, data: Partial<StockMove>): Promise<StockMove>;
  findLocation(id: string): Promise<StockLocation | null>;
  findProduct?(id: string): Promise<{ id: string; standardCost?: number; name?: string } | null>;
  findQuant(keys: {
    companyId?: string;
    productId: string;
    locationId: string;
    lotId?: string;
  }): Promise<StockQuant | null>;
  upsertQuant(quant: StockQuant): Promise<StockQuant>;
  createPicking?(data: StockPicking): Promise<StockPicking>;
  createMove?(data: StockMove): Promise<StockMove>;
  /** Optional; TypeORM/Mongoose factory adapters provide this when available. */
  runInTransaction?<T>(fn: () => Promise<T>): Promise<T>;
}

export type ValuationJournalWriter = (input: {
  picking: StockPicking;
  moves: Array<StockMove & { quantity: number; cost: number }>;
}) => Promise<void>;
