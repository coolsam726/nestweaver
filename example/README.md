# example

NestJS + Nuxt 4 monorepo scaffolded with [nestweaver](https://github.com/coolsam726/nuxest).

## Quick start (Docker — recommended)

Runs the app and all selected services (database, Redis, etc.) in containers:

```bash
docker compose up --build
```

Open **http://localhost:4000**

Use `pnpm docker:down` to stop containers.

The `app` container starts as root briefly to fix ownership on dependency volumes, then runs as your host user (UID/GID baked in at scaffold time). If you still see permission errors from an earlier run, reset volumes with `docker compose down -v` and rebuild.

## Quick start (local app)

Run the app on your host and use Docker only for infrastructure:

```bash
cp .env.example .env
docker compose up -d mongodb redis
pnpm dev
```

`.env.example` uses `localhost` URLs for this workflow. The `app` service in `docker-compose.yml` overrides them with in-network hostnames.

Admin panel: **http://localhost:4000/admin**

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Nest on `:4000` + frontend on `:3000` (on host) |
| `pnpm build` | Production build |
| `pnpm start:prod` | Run production server |
| `pnpm test` | API tests |
| `pnpm docker:up` | Start full dev stack in background |
| `pnpm docker:dev` | Start full dev stack (foreground, with logs) |
| `pnpm docker:down` | Stop containers |

## Structure

```
apps/api          NestJS backend (HTTP entry, /api/*)
apps/web          Nuxt 4 frontend (ssr)
packages/shared   Shared TypeScript types
```

## Docs

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for routing, dev proxy, and SSR/SPA notes.
