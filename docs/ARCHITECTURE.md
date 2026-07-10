# Architecture

Reference for how NestJS and Nuxt 4 share a single HTTP port in this starter kit.

## Overview

```mermaid
flowchart LR
  Client[Browser] --> Nest[NestJS Express :3000]
  Nest -->|"/api/*"| ApiControllers[Nest Controllers]
  Nest -->|static assets| Public["web/.output/public"]
  Nest -->|SSR pages| NuxtListener["Nuxt listener from .output/server"]
```

### Routing contract

| Path | Handler | Mode |
|------|---------|------|
| `/api/*` | NestJS only | prod + dev |
| `/_nuxt/*`, pages, SSR | Nuxt | prod via `listener`, dev via proxy |
| Everything else | Nuxt SSR | prod + dev |

**Rule:** Business APIs live **only** in Nest (`apps/api`). Do **not** add `server/api/` routes in Nuxt — that creates a second backend inside Nitro and breaks routing.

## Repository layout

```
my-app/
├── package.json
├── pnpm-workspace.yaml
├── Dockerfile
├── apps/
│   ├── api/                     # NestJS — HTTP entry point
│   │   └── src/
│   │       ├── main.ts          # bootstrap, prod mount, dev proxy + WS
│   │       ├── app.module.ts
│   │       ├── health.controller.ts
│   │       └── ssr-fallback.controller.ts
│   └── web/                     # Nuxt 4 SSR frontend
│       ├── nuxt.config.ts
│       └── app/pages/
└── packages/
    └── shared/                  # shared types (@repo/shared)
```

## Production flow

1. `pnpm build` runs **Nuxt first**, then Nest
2. Nuxt emits `apps/web/.output/` with `server/index.mjs` exporting `{ listener }`
3. `NODE_ENV=production node apps/api/dist/main.js`:
   - Registers `/api/*` controllers
   - Mounts `express.static(.output/public)`
   - `SsrFallbackController` delegates non-API traffic to the Nitro `listener`

### Nitro preset (required)

```ts
// apps/web/nuxt.config.ts
nitro: {
  preset: 'node-listener',
}
```

The default `node-server` preset starts its own server and does not export `listener`.

### Nest catch-all, not raw `express.use(listener)`

Mounting `listener` via `expressApp.use(listener)` after `app.init()` does not work — Nest's 404 handler intercepts first. Use `SsrFallbackController` with `@All('*')` in production.

### SSR API base URL

During SSR, a relative `$fetch('/api/health')` is handled by Nitro, not Nest → 404.

```vue
// apps/web/app/pages/index.vue
const apiBase = import.meta.server
  ? config.apiBaseServer   // http://127.0.0.1:3000/api
  : config.public.apiBase; // /api (browser, same origin)
```

In dev, Nuxt also proxies `/api/*` to Nest so port `:3001` works for client-side fetches.

## Development flow

| Process | Port | Role |
|---------|------|------|
| Nest | 3000 | User-facing; serves `/api/*`, proxies rest |
| Nuxt | 3001 | Internal; HMR, Vite, Nitro dev |

`pnpm dev` runs both via `concurrently`.

- Dev proxy in `apps/api/src/main.ts` excludes `/api/*`, proxies HTTP to `http://127.0.0.1:3001`
- WebSocket upgrade handler in `main.ts` for Vite HMR
- Vite `hmr.clientPort` is **3001** so HMR connects directly to Nuxt when the app is opened on Nest `:3000` (prevents reload loops)
- Nuxt `devServer.host` must be `127.0.0.1` (not `[::1]`) for the proxy to connect

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `PORT` | `3000` | Nest listen port |
| `NODE_ENV` | — | `production` enables Nuxt listener |
| `ENABLE_WEB_PROXY` | — | `true` in api dev script |
| `WEB_DEV_URL` | `http://127.0.0.1:3001` | Dev proxy target |
| `API_BASE_SERVER` | `http://127.0.0.1:3000/api` | Nuxt SSR → Nest API |

See `.env.example` for a copy-paste template.

## Continuing development

### Add a new API endpoint

1. Add controller/service in `apps/api/src/`
2. Use route prefix `api/...` (e.g. `@Controller('api/users')`)
3. Call from Nuxt with `useFetch(\`${apiBase}/users\`)`
4. Add shared DTOs to `packages/shared` if needed

### Add a new Nuxt page

1. Add `apps/web/app/pages/your-page.vue`
2. SSR data: use `apiBaseServer` on server, `public.apiBase` on client
3. Avoid `server/api/` for business APIs

## Approaches we rejected

| Approach | Why not |
|----------|---------|
| Nest inside Nuxt Nitro plugin | Nitro owns the port |
| Nuxt hosting Nest | Same — wrong owner |
| `node-server` preset + `express.use(listener)` | No `listener` export |
| Duplicate APIs in Nuxt `server/api/` | Two backends |
| Single-process dev without proxy | Loses HMR |

## Smoke tests

```bash
# Production
pnpm build && pnpm start:prod
curl http://localhost:3000/api/health
curl http://localhost:3000/ | grep 'Status:'

# Development
pnpm dev
curl http://localhost:3000/api/health
curl http://localhost:3000/ | grep 'NestJS'
```

## Key files

1. `apps/api/src/main.ts` — entry point, prod/dev branching
2. `apps/api/src/app.module.ts` — dynamic controllers/middleware
3. `apps/web/nuxt.config.ts` — preset, runtimeConfig, devServer, dev API proxy
4. `apps/web/app/pages/index.vue` — SSR fetch pattern
