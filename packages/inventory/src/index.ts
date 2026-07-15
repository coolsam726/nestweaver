import type { ResourceClass } from '@nodeweaver/loom';
import { AdjustmentResourceBase } from './resources/adjustment.resource.js';
import { LocationResourceBase } from './resources/location.resource.js';
import { LotResourceBase } from './resources/lot.resource.js';
import {
  MoveResourceBase,
  PickingResourceBase,
} from './resources/picking.resource.js';
import { QuantResourceBase } from './resources/quant.resource.js';
import { WarehouseResourceBase } from './resources/warehouse.resource.js';

export * from './models/types.js';
export { inventoryModelCatalog } from './models/catalog.js';
export {
  bindResource,
  decorateStore,
  extendPackResource,
} from './extend.js';
export { StockMoveService } from './services/stock-move.service.js';
export { AdjustmentResourceBase } from './resources/adjustment.resource.js';
export { LocationResourceBase } from './resources/location.resource.js';
export { LotResourceBase } from './resources/lot.resource.js';
export {
  MoveResourceBase,
  PickingResourceBase,
} from './resources/picking.resource.js';
export { QuantResourceBase } from './resources/quant.resource.js';
export { WarehouseResourceBase } from './resources/warehouse.resource.js';

export function inventoryResourceBases(): ResourceClass[] {
  return [
    WarehouseResourceBase as unknown as ResourceClass,
    LocationResourceBase as unknown as ResourceClass,
    LotResourceBase as unknown as ResourceClass,
    QuantResourceBase as unknown as ResourceClass,
    PickingResourceBase as unknown as ResourceClass,
    MoveResourceBase as unknown as ResourceClass,
    AdjustmentResourceBase as unknown as ResourceClass,
  ];
}

export const inventoryResources = inventoryResourceBases;
