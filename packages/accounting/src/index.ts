import type { ResourceClass } from '@nodeweaver/loom';
import { AccountResourceBase } from './resources/account.resource.js';
import {
  InvoiceLineResourceBase,
  InvoiceResourceBase,
} from './resources/invoice.resource.js';
import { JournalResourceBase } from './resources/journal.resource.js';
import {
  AccountMoveLineResourceBase,
  AccountMoveResourceBase,
} from './resources/move.resource.js';
import { PaymentResourceBase } from './resources/payment.resource.js';

export * from './models/types.js';
export { accountingModelCatalog } from './models/catalog.js';
export {
  bindResource,
  decorateStore,
  extendPackResource,
} from './extend.js';
export { AccountMoveService } from './services/account-move.service.js';
export { InvoiceService } from './services/invoice.service.js';
export type { InvoiceStore, ProductAccounts } from './services/invoice.service.js';
export {
  createStockValuationWriter,
} from './services/stock-valuation.writer.js';
export type {
  StockValuationProductAccounts,
  StockValuationWriterOptions,
} from './services/stock-valuation.writer.js';
export { AccountResourceBase } from './resources/account.resource.js';
export { JournalResourceBase } from './resources/journal.resource.js';
export {
  AccountMoveLineResourceBase,
  AccountMoveResourceBase,
} from './resources/move.resource.js';
export {
  InvoiceLineResourceBase,
  InvoiceResourceBase,
} from './resources/invoice.resource.js';
export { PaymentResourceBase } from './resources/payment.resource.js';

export function accountingResourceBases(): ResourceClass[] {
  return [
    AccountResourceBase as unknown as ResourceClass,
    JournalResourceBase as unknown as ResourceClass,
    AccountMoveResourceBase as unknown as ResourceClass,
    AccountMoveLineResourceBase as unknown as ResourceClass,
    InvoiceResourceBase as unknown as ResourceClass,
    InvoiceLineResourceBase as unknown as ResourceClass,
    PaymentResourceBase as unknown as ResourceClass,
  ];
}

export const accountingResources = accountingResourceBases;
