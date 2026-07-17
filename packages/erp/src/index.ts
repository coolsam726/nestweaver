import type { ResourceClass } from '@nodeweaver/loom';
import { PartnerResourceBase } from './resources/partner.resource.js';
import { ProductResourceBase } from './resources/product.resource.js';
import { TaxResourceBase } from './resources/tax.resource.js';
import { UomCategoryResourceBase } from './resources/uom-category.resource.js';
import { UomResourceBase } from './resources/uom.resource.js';

export * from './models/types.js';
export { erpModelCatalog } from './models/catalog.js';
export {
  bindResource,
  decorateStore,
  extendPackResource,
} from './extend.js';
export { PartnerResourceBase } from './resources/partner.resource.js';
export { ProductResourceBase } from './resources/product.resource.js';
export { TaxResourceBase } from './resources/tax.resource.js';
export { UomCategoryResourceBase } from './resources/uom-category.resource.js';
export { UomResourceBase } from './resources/uom.resource.js';

/**
 * Resource base classes for the ERP commercial kernel.
 * Apps subclass each base, bind `static model`, and pass the classes to LoomModule.
 */
export function erpResourceBases(): ResourceClass[] {
  return [
    PartnerResourceBase as unknown as ResourceClass,
    ProductResourceBase as unknown as ResourceClass,
    UomCategoryResourceBase as unknown as ResourceClass,
    UomResourceBase as unknown as ResourceClass,
    TaxResourceBase as unknown as ResourceClass,
  ];
}

/** @deprecated alias — prefer binding concrete app subclasses */
export const erpResources = erpResourceBases;
