/** Shared commercial record shapes (ORM-agnostic). */

export type PartnerType = 'customer' | 'vendor' | 'both';

export interface ErpPartner {
  id?: string;
  companyId?: string;
  name: string;
  email?: string;
  phone?: string;
  isCompany?: boolean;
  partnerType?: PartnerType;
  street?: string;
  city?: string;
  country?: string;
  vat?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductType = 'goods' | 'service';
export type ProductTracking = 'none' | 'lot' | 'serial';
export type CostMethod = 'standard' | 'average' | 'fifo';

export interface ErpProduct {
  id?: string;
  companyId?: string;
  name: string;
  sku?: string;
  barcode?: string;
  productType?: ProductType;
  uomId?: string;
  tracking?: ProductTracking;
  costMethod?: CostMethod;
  listPrice?: number;
  standardCost?: number;
  /** Accounting account ids (Wave 3 hooks). */
  incomeAccountId?: string;
  expenseAccountId?: string;
  stockAccountId?: string;
  stockInputAccountId?: string;
  stockOutputAccountId?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ErpUomCategory {
  id?: string;
  companyId?: string;
  name: string;
  createdAt?: Date;
}

export interface ErpUom {
  id?: string;
  companyId?: string;
  name: string;
  categoryId?: string;
  /** Factor relative to category reference UoM (1 = reference). */
  factor?: number;
  rounding?: number;
  active?: boolean;
  createdAt?: Date;
}

export type TaxScope = 'sale' | 'purchase' | 'none';
export type TaxAmountType = 'percent' | 'fixed';

export interface ErpTax {
  id?: string;
  companyId?: string;
  name: string;
  amount?: number;
  amountType?: TaxAmountType;
  scope?: TaxScope;
  active?: boolean;
  createdAt?: Date;
}
