import { companyStampFields, defineModel, f } from '@nodeweaver/persistence';

/**
 * Single source of truth for ERP table shapes.
 * All ORM kits (`./mongoose`, `./typeorm`, `./prisma`, `./drizzle`) are derived from this.
 */
export const erpModelCatalog = {
  Partner: defineModel('ErpPartner', 'erp_partners', {
    ...companyStampFields(),
    name: f('string', { required: true }),
    email: f('string'),
    phone: f('string'),
    isCompany: f('boolean', { default: true }),
    partnerType: f('string', { default: 'both' }),
    street: f('string'),
    city: f('string'),
    country: f('string'),
    vat: f('string'),
    active: f('boolean', { default: true }),
  }),
  Product: defineModel('ErpProduct', 'erp_products', {
    ...companyStampFields(),
    name: f('string', { required: true }),
    sku: f('string'),
    barcode: f('string'),
    productType: f('string', { default: 'goods' }),
    uomId: f('string'),
    tracking: f('string', { default: 'none' }),
    costMethod: f('string', { default: 'standard' }),
    listPrice: f('float', { default: 0 }),
    standardCost: f('float', { default: 0 }),
    incomeAccountId: f('string'),
    expenseAccountId: f('string'),
    stockAccountId: f('string'),
    stockInputAccountId: f('string'),
    stockOutputAccountId: f('string'),
    active: f('boolean', { default: true }),
  }),
  UomCategory: defineModel('ErpUomCategory', 'erp_uom_categories', {
    ...companyStampFields({ updatedAt: false }),
    name: f('string', { required: true }),
  }),
  Uom: defineModel('ErpUom', 'erp_uoms', {
    ...companyStampFields({ updatedAt: false }),
    name: f('string', { required: true }),
    categoryId: f('string'),
    factor: f('float', { default: 1 }),
    rounding: f('float', { default: 0.01 }),
    active: f('boolean', { default: true }),
  }),
  Tax: defineModel('ErpTax', 'erp_taxes', {
    ...companyStampFields({ updatedAt: false }),
    name: f('string', { required: true }),
    amount: f('float', { default: 0 }),
    amountType: f('string', { default: 'percent' }),
    scope: f('string', { default: 'sale' }),
    active: f('boolean', { default: true }),
  }),
} as const;
