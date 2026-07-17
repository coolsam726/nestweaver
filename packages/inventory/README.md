# `@nodeweaver/inventory`

Stock operations for Nodeweaver Loom: **warehouses**, **locations**, **quants**, **pickings/moves**, **lots**, and **adjustments**.

## Install

```bash
pnpm add @nodeweaver/inventory @nodeweaver/erp @nodeweaver/loom @nodeweaver/persistence
```

## Usage — resources (ORM-agnostic CRUD)

```ts
import { WarehouseResourceBase, bindResource } from '@nodeweaver/inventory';
import { WarehouseEntity } from './entities';

export const WarehouseResource = bindResource(WarehouseResourceBase, WarehouseEntity);
// register with LoomModule.resources
```

Admin CRUD goes through **Loom’s adapters** (TypeORM / Prisma / Drizzle / Mongoose). Pack resource bases never import an ORM.

## Usage — domain store (validate / reserve)

```ts
import { createStockStore } from '@nodeweaver/inventory/adapters';
import { StockMoveService } from '@nodeweaver/inventory';

const store = createStockStore({
  orm: 'typeorm', // or 'mongoose' — prisma/drizzle: implement StockStore yourself for now
  dataSource,     // same DataSource / Connection as LoomModule
  models: {
    picking: StockPicking,
    move: StockMove,
    location: StockLocation,
    quant: StockQuant,
    product: ErpProduct, // optional
  },
});

const stock = new StockMoveService(store /*, valuationWriter */);
await stock.validate(pickingId);
```

Optional model kits (from one catalog — edit `models/catalog.ts` only):

| Import | ORM |
|--------|-----|
| `@nodeweaver/inventory/mongoose` | Mongoose |
| `@nodeweaver/inventory/typeorm` | TypeORM |
| `@nodeweaver/inventory/prisma` | Prisma fragment |
| `@nodeweaver/inventory/drizzle` | Drizzle |

Optional mongoose schema helpers: `@nodeweaver/inventory/mongoose`.

## Extending (without forking)

| Goal | Approach |
|------|----------|
| Bind your ORM model | `bindResource(Base, MyEntity)` |
| Extra fields / UI | `extendPackResource(Base, { model, form, table, … })` or subclass `extends Base` |
| New entity in the pack’s world | Add your own `Resource` + entity; register beside pack resources |
| Custom domain persistence | Implement `StockStore` yourself, or `decorateStore(createStockStore(…), { upsertQuant: … })` |
| Extra validate side-effects | Wrap `StockMoveService` or pass a custom `valuationWriter` |
| Replace a resource entirely | Omit the base from `resources` and register your own class with the same or different slug |

```ts
import { ProductResourceBase, extendPackResource } from '@nodeweaver/erp';
import { TextField } from '@nodeweaver/loom';

export const ProductResource = extendPackResource(ProductResourceBase, {
  model: ProductEntity,
  form: (schema) => {
    schema.section('brand', 'Brand').fields(TextField.make('brand'));
  },
});
```

Loom’s `extendResource` is also available if you need deeper composition.

## Domain (Odoo-inspired)

| Concept | Slug |
|---------|------|
| Warehouse | `warehouses` |
| Location | `stock-locations` |
| Quant | `stock-quants` |
| Lot/Serial | `stock-lots` |
| Picking | `stock-pickings` |
| Move | `stock-moves` |
| Adjustment | `stock-adjustments` |

Move states: `draft → confirmed → assigned → done | cancel`. Validate writes quants; assign fails closed on oversell for **internal** locations only.
