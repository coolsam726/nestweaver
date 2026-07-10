# API (`apps/api`)

NestJS backend and **production HTTP entry point** for this monorepo.

- Serves `/api/*` in dev and production
- Proxies non-API traffic to Nuxt dev server in development
- Mounts the Nuxt Nitro `listener` in production

See the [root README](../../README.md) and [architecture docs](../../docs/ARCHITECTURE.md).
