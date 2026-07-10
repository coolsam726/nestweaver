# @weaver/velm

Declarative admin panel for NestJS — inspired by [Filament 5](https://filamentphp.com/) and PyVelm.

Define resources in TypeScript. Velm renders a full CRUD UI with **Handlebars**, **Tailwind CSS**, and **Alpine.js**. Works with the ORMs supported by [nestweaver](https://github.com/coolsam726/nuxest): TypeORM, Prisma, Drizzle, and Mongoose.

**Theme:** primary `#286291`, accent `#F1511B`, page background `#FEE9E2` (accent-100).

## Install

```bash
pnpm add @weaver/velm handlebars
```

Install your ORM peer as needed (`typeorm`, `@prisma/client`, `drizzle-orm`, or `mongoose`).

## Quick start

```typescript
import { Module } from '@nestjs/common';
import { VelmModule } from '@weaver/velm';
import { CompanyResourceBase } from '@weaver/velm/base';
import { Company } from './database/company.entity.js';

export class CompanyResource extends CompanyResourceBase {
  static override model = Company;
}

@Module({
  imports: [
    VelmModule.forRoot({
      orm: 'typeorm',
      dataSource: appDataSource,
      resources: [CompanyResource],
      basePath: '/admin',
      title: 'My App Admin',
    }),
  ],
})
export class AppModule {}
```

Visit `/admin` for the dashboard, `/admin/companies` for the resource list.

## Filament-style API

### Schemas (forms)

Use `Schema` with sections — mirrors Filament form schemas:

```typescript
static override form(schema: Schema) {
  return schema
    .section('identity', 'Identity', 'Core details')
    .columns(2)
    .fields(
      TextField.make('name').required(),
      EmailField.make('email').required(),
      PasswordField.make('password').required(),
    )
    .build();
}
```

### Tables (lists)

Use `Table` for list columns, search, and default sort:

```typescript
static override table(table: Table) {
  return table
    .columns(TextColumn.make('name').searchable().sortable())
    .defaultSort('name', 'asc')
    .build();
}
```

### Detail (infolist)

Optional `detail()` defines a read-only infolist. When omitted, the detail route renders a **readonly form** built from the form schema.

```typescript
static override detail(infolist: InfolistBuilder) {
  return infolist
    .section('profile', 'Profile')
    .entries(TextColumn.make('name'), TextColumn.make('email'))
    .build();
}
```

### Kanban (optional)

```typescript
static override kanban(kanban: KanbanBuilder) {
  return kanban
    .card('title')
    .groupBy('status')
    .columns({ todo: 'To do', done: 'Done' })
    .build();
}
```

### Actions

Override `headerActions()` and `recordActions()` with `CreateAction`, `EditAction`, `ViewAction`, `DeleteAction`.

### Base modules

Extendable **Companies** and **Users** ship in `@weaver/velm/base`:

```typescript
import { CompanyResourceBase } from '@weaver/velm/base';
import { Company } from '../database/company.schema';

export class CompanyResource extends CompanyResourceBase {
  static override model = Company;
}
```

Use `extendResource()` to customize a base without subclassing.

### Fields & columns

- **Fields:** `TextField`, `TextareaField`, `NumberField`, `BooleanField`, `DateField`, `DateTimeField`, `SelectField`, `RelationField`, `EmailField`, `PasswordField`
- **Columns:** `IdColumn`, `TextColumn`, `BooleanColumn`, `DateColumn`, `DateTimeColumn`

## ORM adapters

Velm picks an adapter from `orm` + `dataSource`, or you can pass a custom `adapter`.

| ORM | `dataSource` shape |
|-----|-------------------|
| `typeorm` | TypeORM `DataSource` |
| `prisma` | `PrismaClient` instance |
| `drizzle` | `{ db, schema }` where `schema` exports table objects |
| `mongoose` | Mongoose `Connection` (or `Model` registry via `connection.model`) |

## Routes

| Method | Path | Action |
|--------|------|--------|
| GET | `/admin` | Dashboard |
| GET | `/admin/:resource` | List (search, sort, pagination) |
| GET | `/admin/:resource/kanban` | Kanban view (when defined) |
| GET | `/admin/:resource/create` | Create form |
| POST | `/admin/:resource` | Store |
| GET | `/admin/:resource/:id` | Detail (infolist or readonly form) |
| GET | `/admin/:resource/:id/edit` | Edit form |
| POST | `/admin/:resource/:id` | Update |
| POST | `/admin/:resource/:id/delete` | Delete |
| GET | `/admin/assets/admin.css` | Bundled Tailwind CSS |

## Development

```bash
pnpm --filter @weaver/velm build:css
pnpm --filter @weaver/velm build
```

## License

MIT
