# `@nodeweaver/accounting`

Financials for Nodeweaver Loom: **chart of accounts**, **journals**, **moves/lines**, **invoices/bills**, and **payments**.

## Install

```bash
pnpm add @nodeweaver/accounting @nodeweaver/erp @nodeweaver/loom @nodeweaver/persistence
# optional Wave 3 glue:
pnpm add @nodeweaver/inventory
```

## Usage — resources

```ts
import { AccountResourceBase, bindResource } from '@nodeweaver/accounting';
export const AccountResource = bindResource(AccountResourceBase, AccountEntity);
```

## Usage — domain store

```ts
import { createAccountingStore } from '@nodeweaver/accounting/adapters';
import { AccountMoveService, InvoiceService } from '@nodeweaver/accounting';

const store = createAccountingStore({
  orm: 'typeorm', // or mongoose
  dataSource,
  models: {
    move: AccountMove,
    moveLine: AccountMoveLine,
    invoice: AccountInvoice,
    invoiceLine: AccountInvoiceLine,
    payment: AccountPayment,
    journal: AccountJournal,
    account: AccountAccount,
  },
});

const moves = new AccountMoveService(store);
await moves.post(moveId);
```

### Stock valuation (Wave 3)

```ts
import { StockMoveService } from '@nodeweaver/inventory';
import { createStockValuationWriter } from '@nodeweaver/accounting';

const valuationWriter = createStockValuationWriter(store, {
  journalId: inventoryJournalId,
  resolveProduct: async (id) => { /* stock / input / output accounts */ },
});
```

Optional model kits (from one catalog — edit `models/catalog.ts` only): `@nodeweaver/accounting/{mongoose,typeorm,prisma,drizzle}`.

## Extending

Same patterns as inventory/erp:

- `bindResource` / `extendPackResource` for resources
- Implement or `decorateStore` an `InvoiceStore` / `AccountingStore` for custom tables, audit, or Prisma/Drizzle until factories land
- Add your own resources (analytic accounts, tax reports, …) next to pack resources in `LoomModule`
- Never soft-delete posted moves — use `AccountMoveService.reverse`
