# `@nodeweaver/erp`

Shared commercial kernel for Nodeweaver Loom apps: **partners**, **products**, **units of measure**, and **taxes**.

## Install

```bash
pnpm add @nodeweaver/erp @nodeweaver/loom @nodeweaver/persistence
```

## Usage

Bind models (any Loom-supported ORM) and register with Loom:

```ts
import { PartnerResourceBase, bindResource } from '@nodeweaver/erp';

export const PartnerResource = bindResource(PartnerResourceBase, PartnerEntity);

LoomModule.forRoot({
  resources: [
    CompanyResource, UserResource, RoleResource, PermissionResource,
    PartnerResource, ProductResource, UomCategoryResource, UomResource, TaxResource,
    // …inventory / accounting
  ],
});
```

Optional model kits (all derived from one catalog — edit `models/catalog.ts` only):

| Import | ORM |
|--------|-----|
| `@nodeweaver/erp/mongoose` | Mongoose |
| `@nodeweaver/erp/typeorm` | TypeORM `EntitySchema` |
| `@nodeweaver/erp/prisma` | Prisma schema fragment |
| `@nodeweaver/erp/drizzle` | Drizzle tables |

## Extending

| Goal | Approach |
|------|----------|
| Bind ORM model | `bindResource(Base, MyEntity)` or `class X extends Base { static model = … }` |
| Extra fields / UI | `extendPackResource(Base, { form, table, … })` |
| Brand-new master data | New `Resource` subclass; register next to pack resources |
| Patch behavior at runtime | `decorateStore` is for inventory/accounting stores; for CRUD use Loom hooks / custom actions |

Packs stay ORM-agnostic: resources describe UI; apps own entities. Domain services live in inventory/accounting behind `StockStore` / `AccountingStore` factories (`@nodeweaver/*/adapters`).

## Related packs

| Package | Role |
|---------|------|
| `@nodeweaver/persistence` | Shared OrmKind / id helpers (not a fifth ORM) |
| `@nodeweaver/inventory` | Warehouses, quants, pickings/moves |
| `@nodeweaver/accounting` | CoA, journals, invoices, payments |

Independent semver; peer on `@nodeweaver/loom` (`>=0.1.5`).

## Navigation

**Master data** (Commercial / Units / Fiscal), **company-scoped** when Loom tenancy is on.
