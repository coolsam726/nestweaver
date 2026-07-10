# create-nuxest

npm package for `npm create nuxest@latest`.

This is a thin wrapper around the [`nuxest`](../nuxest) scaffolder — the same prompts and templates, exposed the way npm/pnpm/yarn expect for `create-*` packages.

## Local development

```bash
pnpm --filter nuxest build
pnpm --filter create-nuxest dev my-app
```

## Publish

Publish `nuxest` first, then `create-nuxest` (it depends on `nuxest`).
