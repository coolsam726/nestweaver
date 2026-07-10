# weaver CLI

Core scaffolder used by `create-nestweaver` and the `weaver` binary.

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
