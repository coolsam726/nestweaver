# weaver CLI

Core scaffolder used by `create-nestweaver` and the `weaver` binary.

Nestweaver scaffolds **NestJS + frontend** monorepos with **[Loom](../loom/README.md)** included by default — declarative admin, auth/RBAC, tenancy, media, and a versioned JSON API in the same app.

Frontend choices include Nuxt, Angular, Vite (React/Vue/Svelte), and **Nest + Handlebars + Alpine** for a full-stack app that reuses Loom sessions, CSRF, theme, and branding with an app-owned public layout (no `apps/web`).

## Usage

```bash
npm create nestweaver@latest my-app

# from this monorepo
pnpm --filter nestweaver dev my-app
node packages/nestweaver/dist/cli.js my-app
```

## Programmatic API

```ts
import { runCreate, collectOptions, scaffoldProject } from 'nestweaver';
```

## Admin panel (Loom)

Every scaffold includes a full Loom setup:

- `apps/api/src/admin/loom-admin.module.ts` — `LoomModule.forRootAsync` with sync `basePath` / `api` + ORM inject + auth

- Resources: Company, User, Role, Permission (extending `@nestweaver/loom/base`)
- ACL models matched to the selected ORM:
  - **TypeORM** — `LoomRole` / `LoomPermission` entities registered in `DatabaseModule`, plus `migrations/` + `data-source.ts` (`db:migrate`; prod `migrationsRun`)
  - **Prisma** — `LoomRole` / `LoomPermission` in `schema.prisma` + initial `prisma/migrations` (`db:migrate` / `db:push`)
  - **Drizzle** — `loomRoles` / `loomPermissions` tables + `drizzle/0000_init.sql` (`db:migrate` / `db:push`)
  - **Mongoose** — Company/User schemas; Role/Permission registered at runtime by Loom
- **Wave 4 defaults:** `api.version: 'v1'` + OpenAPI, `securityHeaders`, local `storage` (`LOOM_UPLOADS_DIR`), and `audit.onAudit` (dev console)

### Env vars (scaffolded)

| Variable | Purpose |
|----------|---------|
| `APP_BASE_PATH` | Optional mount prefix for the whole app (e.g. `/my-app`). Empty = domain root. Nest owns the full prefix (proxy must not strip it). |
| `LOOM_AUTH_SECRET` | Enables cookie auth + RBAC |
| `LOOM_BASE_PATH` | Admin URL prefix (default `{APP_BASE_PATH}/admin`). Must stay under `APP_BASE_PATH` when that is set — also used by the web proxy / SPA·SSR fallback |
| `LOOM_ADMIN_EMAIL` | Seed admin email (default `admin@example.com`) |
| `LOOM_ADMIN_PASSWORD` | Seed admin password (default `password`) |
| `LOOM_ADMIN_NAME` | Seed admin display name |
| `LOOM_UPLOADS_DIR` | Local media root for `FileField` / `ImageField` (default `./uploads`) |
| `LOOM_BRAND_*` | Optional branding overrides (see Loom README) |

After `docker compose up` / `pnpm dev`, open `/admin` (or `{APP_BASE_PATH}/admin`) and sign in with the seed credentials. API docs: `/api/loom/v1/docs` (Swagger) or `/api/loom/v1/redoc` (Redoc) — under the same app base when set.

### Nest + Handlebars + Alpine (`nest-hbs`)

When this frontend is selected:

- No `apps/web` — Nest alone serves the product UI
- Starter routes: `/` (public), `/app` (auth-required app shell); Loom auth at `/login`, `/logout`, `/forgot-password`, `/reset-password` (all under `APP_BASE_PATH` when set)
- Shared `loom_session` / CSRF / `loom-theme` / branding CSS with Loom admin
- Public assets at `/assets/*` (same CSS/JS/branding as admin)
- Root `pnpm dev` runs only the API package

For production databases, run `pnpm --filter api db:migrate` (TypeORM also applies migrations automatically when `NODE_ENV=production`).

Full feature docs: [`@nestweaver/loom` README](../loom/README.md) · [Loom 1.0 readiness](../../docs/LOOM_1_0.md).
