import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { generateApiPackageJson } from './generators/api-package-json.js';
import { generateAppModule } from './generators/app-module.js';
import { generateEnvExample } from './generators/env.js';
import { generateMain } from './generators/main.js';
import { generateIndexVue, generateNuxtConfig } from './generators/nuxt-config.js';
import { renderFile, toContext } from './render.js';
import type { ScaffoldOptions, TemplateContext } from './types.js';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES_ROOT = join(PACKAGE_ROOT, 'templates');

const SKIP = new Set(['node_modules', '.git', 'dist', '.output', '.nuxt']);

export async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
  const context = toContext(options);
  const { targetDir, projectName, sharedScope } = context;

  mkdirSync(targetDir, { recursive: true });

  copyDir(join(TEMPLATES_ROOT, 'base'), targetDir, context);
  applyFeatures(options, context);

  writeGeneratedFiles(options, context);

  console.log('Installing dependencies...');
  execSync('pnpm install', { cwd: targetDir, stdio: 'inherit' });

  printNextSteps(options);
}

function applyFeatures(options: ScaffoldOptions, context: TemplateContext): void {
  const features = join(TEMPLATES_ROOT, 'features');

  if (options.orm !== 'none' && options.database) {
    copyDir(join(features, 'orm', options.orm, '_shared'), options.targetDir, context);
    copyDir(
      join(features, 'orm', options.orm, options.database),
      options.targetDir,
      context,
    );
  }

  if (options.scheduling) {
    copyDir(join(features, 'scheduling'), options.targetDir, context);
  }

  if (options.queues) {
    copyDir(join(features, 'queues'), options.targetDir, context);
  }

  if (options.admin) {
    copyDir(join(features, 'admin', options.httpAdapter), options.targetDir, context);
  }

  if (options.nuxtMode === 'spa') {
    copyDir(join(features, 'nuxt-spa'), options.targetDir, context);
  }
}

function writeGeneratedFiles(
  options: ScaffoldOptions,
  context: TemplateContext,
): void {
  const { targetDir, sharedScope } = context;

  const writes: Array<[string, string]> = [
    [join(targetDir, 'apps/api/src/main.ts'), generateMain(options)],
    [join(targetDir, 'apps/api/src/app.module.ts'), generateAppModule(options)],
    [
      join(targetDir, 'apps/api/package.json'),
      `${JSON.stringify(generateApiPackageJson(options, sharedScope), null, 2)}\n`,
    ],
    [join(targetDir, 'apps/web/nuxt.config.ts'), generateNuxtConfig(options)],
    [
      join(targetDir, 'apps/web/app/pages/index.vue'),
      generateIndexVue(options),
    ],
    [join(targetDir, '.env.example'), generateEnvExample(options)],
  ];

  for (const [filePath, content] of writes) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
  }
}

function copyDir(
  sourceRoot: string,
  targetRoot: string,
  context: TemplateContext,
): void {
  if (!existsSync(sourceRoot)) return;

  walk(sourceRoot, (sourcePath) => {
    const rel = relative(sourceRoot, sourcePath);
    const destPath = join(
      targetRoot,
      rel.endsWith('.hbs') ? rel.slice(0, -4) : rel,
    );

    mkdirSync(dirname(destPath), { recursive: true });

    if (sourcePath.endsWith('.hbs')) {
      writeFileSync(destPath, renderFile(sourcePath, context));
    } else {
      cpSync(sourcePath, destPath);
    }
  });
}

function walk(dir: string, onFile: (path: string) => void): void {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path, onFile);
    } else {
      onFile(path);
    }
  }
}

function printNextSteps(options: ScaffoldOptions): void {
  console.log('');
  console.log(`Done! Project scaffolded at ${options.targetDir}`);
  console.log('');
  console.log(`  cd ${options.projectName}`);
  console.log('  cp .env.example .env');
  console.log('  pnpm dev');
  console.log('');
  console.log('Open http://localhost:3000');
  if (options.admin) {
    console.log('Admin: http://localhost:3000/admin');
  }
}
