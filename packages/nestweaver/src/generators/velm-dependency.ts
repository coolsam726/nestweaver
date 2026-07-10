import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

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
export function vendorVelmPackage(targetDir: string): boolean {
  const sourceDir = findSourceVelmPackage(targetDir);
  if (!sourceDir) {
    return false;
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

  return true;
}

function ensureVelmBuilt(velmDir: string): void {
  const distEntry = join(velmDir, 'dist', 'index.js');
  const css = join(velmDir, 'assets', 'admin.css');
  if (existsSync(distEntry) && existsSync(css)) {
    return;
  }
  execSync('pnpm build && pnpm build:css', { cwd: velmDir, stdio: 'inherit' });
}

export function findSourceVelmPackage(targetDir: string): string | null {
  const vendoredDir = join(targetDir, 'packages', 'velm');
  let dir = targetDir;

  while (true) {
    const candidate = join(dir, 'packages', 'velm');
    if (
      candidate !== vendoredDir &&
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
