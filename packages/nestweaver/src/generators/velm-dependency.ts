import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const NESTWEAVER_PACKAGE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
);

export interface VelmDependencyResolution {
  specifier: string;
}

const VELM_PACKAGE_FILES = ['dist', 'views', 'assets', 'package.json'] as const;

export function resolveVelmDependency(targetDir: string): VelmDependencyResolution {
  const fromEnv = process.env.NESTWEAVER_VELM_DEP?.trim();
  if (fromEnv) {
    return { specifier: fromEnv };
  }

  if (
    existsSync(join(targetDir, 'packages', 'velm', 'package.json')) ||
    findSourceVelmPackage(targetDir)
  ) {
    return { specifier: 'workspace:*' };
  }

  return { specifier: '^0.1.0' };
}

/** Copy a built @weaver/velm into the scaffold project for Docker/local self-containment. */
export function vendorVelmPackage(targetDir: string): void {
  const sourceDir = findSourceVelmPackage(targetDir);
  if (!sourceDir) {
    throw new Error(
      'Cannot vendor @weaver/velm: source package not found. Set NESTWEAVER_VELM_DEP or run from the nestweaver monorepo.',
    );
  }

  ensureVelmBuilt(sourceDir);

  const destDir = join(targetDir, 'packages', 'velm');
  mkdirSync(destDir, { recursive: true });

  for (const item of VELM_PACKAGE_FILES) {
    const from = join(sourceDir, item);
    if (!existsSync(from)) {
      throw new Error(`Cannot vendor @weaver/velm: missing ${from}`);
    }
    cpSync(from, join(destDir, item), { recursive: true });
  }
}

function ensureVelmBuilt(velmDir: string): void {
  const distEntry = join(velmDir, 'dist', 'index.js');
  const css = join(velmDir, 'assets', 'admin.css');
  if (existsSync(distEntry) && existsSync(css)) {
    return;
  }
  execSync('pnpm build && pnpm build:css', { cwd: velmDir, stdio: 'inherit' });
}

function monorepoVelmPackage(): string | null {
  const candidate = join(NESTWEAVER_PACKAGE_DIR, '..', 'velm');
  if (existsSync(join(candidate, 'package.json'))) {
    return candidate;
  }
  return null;
}

function walkUpForVelm(startDir: string, excludeDir?: string): string | null {
  let dir = startDir;

  while (true) {
    const candidate = join(dir, 'packages', 'velm');
    if (
      (!excludeDir || resolve(candidate) !== resolve(excludeDir)) &&
      existsSync(join(candidate, 'package.json'))
    ) {
      return candidate;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

export function findSourceVelmPackage(targetDir: string): string | null {
  return (
    monorepoVelmPackage() ??
    walkUpForVelm(targetDir, join(targetDir, 'packages', 'velm')) ??
    walkUpForVelm(process.cwd())
  );
}
