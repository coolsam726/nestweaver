# nuxest

Scaffold **NestJS + Nuxt 4** monorepos with an interactive, batteries-included CLI.

## Create a project

```bash
npm create nuxest@latest my-app
pnpm create nuxest my-app
yarn create nuxest my-app
bun create nuxest my-app
```

Use `.` as the directory name to scaffold into the current folder:

```bash
npm create nuxest@latest .
```

You'll be prompted for ORM, database, scheduling, queues, HTTP adapter, admin panel, and Nuxt mode (SSR/SPA).

## After scaffolding

```bash
cd my-app
cp .env.example .env
pnpm dev
```

Open **http://localhost:3000**

## Development (this repo)

```bash
pnpm install
pnpm build

# simulate npm create locally
pnpm --filter create-nuxest dev my-app

# or via nuxest directly
pnpm --filter nuxest dev my-app
```

## Publish to npm

### One-time setup

1. Create an [npm access token](https://www.npmjs.com/settings/~your-user/tokens) with **Publish** permission.
2. Add it to the GitHub repository as secret **`NPM_TOKEN`**.

### Release flow

1. Bump versions in `packages/nuxest/package.json` and `packages/create-nuxest/package.json` (keep them in sync).
2. Commit, push to `main`, and [create a GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release) for the tag (e.g. `v0.1.0`).

The **Publish** workflow runs on `release: published`, builds, smoke-tests the scaffolder, then publishes `nuxest` and `create-nuxest`.

### Manual publish (dry run)

GitHub → Actions → **Publish** → **Run workflow** → enable **Dry run** to validate without publishing.

### Local publish

```bash
pnpm build
pnpm --filter nuxest publish --access public --no-git-checks
pnpm --filter create-nuxest publish --access public --no-git-checks
```

Users then run `npm create nuxest@latest`.

## Packages

| Package | Role |
|---------|------|
| `create-nuxest` | npm entry for `npm create nuxest` |
| `nuxest` | Core scaffolder, templates, and `nuxest` CLI |

## License

MIT
