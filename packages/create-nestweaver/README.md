# create-nestweaver

npm package for `npm create nestweaver@latest`.

This is a thin wrapper around the [`nestweaver`](../nestweaver) scaffolder — the same prompts and templates, exposed the way npm/pnpm/yarn expect for `create-*` packages.

## Local dev

```bash
pnpm --filter nestweaver build
pnpm --filter create-nestweaver dev my-app
```

## Publish order

Publish `nestweaver` first, then `create-nestweaver` (it depends on `nestweaver`).
