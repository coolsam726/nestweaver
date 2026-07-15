# `@nodeweaver/persistence`

Thin shared primitives for **ORM-agnostic** Nodeweaver packs. This is **not** a fifth ORM and not a replacement for Loom’s `LoomAdapter`.

## What it provides

- Shared `OrmKind` (`typeorm` | `prisma` | `drizzle` | `mongoose`)
- Model ref helpers (`ModelRef`, `modelRefKey`, `toPlainRecord`, `coerceId`)
- `CreateStoreOptions` + `unsupportedStore` for pack factories
- **Model catalog** — define fields once (`defineModel` / `f` / `companyStampFields`), emit all four ORMs

## Canonical catalog → ORM kits

```ts
import { defineModel, f, toPrismaSchemaFragment, defineTypeOrmEntities } from '@nodeweaver/persistence';

const Partner = defineModel('ErpPartner', 'erp_partners', {
  name: f('string', { required: true }),
});

// TypeORM EntitySchema options / instances
// Mongoose schema definitions
// Prisma schema.prisma fragment (paste + generate)
// Drizzle sqlite/pg tables
```

Packs (`erp`, `inventory`, `accounting`) keep a `models/catalog.ts` and expose:

| Import | What you get |
|--------|----------------|
| `@nodeweaver/erp/mongoose` | `defineErpMongooseModels(mongoose)` |
| `@nodeweaver/erp/typeorm` | `defineErpTypeOrmEntities(EntitySchema)` |
| `@nodeweaver/erp/prisma` | `erpPrismaSchemaFragment()` |
| `@nodeweaver/erp/drizzle` | `defineErpDrizzleTables({ table, text, integer, real })` |

**Changing a field:** edit the catalog only. Regenerated kits stay in sync.

## Domain stores

```ts
import { createStockStore } from '@nodeweaver/inventory/adapters';
```

CRUD still uses Loom adapters; domain workflows use pack ports.
