# nuxest CLI

Core scaffolder used by `create-nuxest` and the `nuxest` binary.

## Usage

```bash
# published
npm create nuxest@latest my-app

# local
pnpm --filter nuxest dev my-app
node packages/nuxest/dist/cli.js my-app
```

## Programmatic API

```ts
import { runCreate, collectOptions, scaffoldProject } from 'nuxest';

await runCreate(['my-app']);
```
