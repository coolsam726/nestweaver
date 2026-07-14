# create-nodeweaver

npm package for `npm create nodeweaver@latest`.

This is a thin wrapper around the [`nodeweaver`](../nodeweaver) scaffolder — the same prompts and templates, exposed the way npm/pnpm/yarn expect for `create-*` packages.

## Local dev

```bash
pnpm --filter nodeweaver build
pnpm --filter create-nodeweaver dev my-app
```

## Publish order

1. `@nodeweaver/loom` — admin panel (publish first; creates the `@nodeweaver` scope on npm if needed)
2. `nodeweaver` — scaffolder CLI and templates
3. `create-nodeweaver` — `npm create` entry (depends on `nodeweaver`)
