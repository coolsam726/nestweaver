import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateAngularBasePathHelper } from './generators/angular-config.js';
import { generateEnvExample } from './generators/env.js';
import { generateLoomAdminModule } from './generators/loom-admin.js';
import { generateMain } from './generators/main.js';
import { generateNuxtConfig } from './generators/nuxt-config.js';
import { generateViteConfig } from './generators/vite-config.js';
import type { ScaffoldOptions } from './types.js';

const base: ScaffoldOptions = {
  projectName: 'app-base-test',
  targetDir: '/tmp/app-base-test',
  frontend: 'nuxt',
  orm: 'mongoose',
  database: 'mongodb',
  scheduling: false,
  queues: false,
  httpAdapter: 'express',
  admin: true,
  renderMode: 'spa',
};

describe('APP_BASE_PATH scaffold wiring', () => {
  it('documents APP_BASE_PATH in .env.example', () => {
    const env = generateEnvExample(base);
    assert.match(env, /APP_BASE_PATH=/);
    assert.match(env, /Example: APP_BASE_PATH=\/my-app/);
  });

  it('syncs appBasePath into LoomModule.forRootAsync', () => {
    const mod = generateLoomAdminModule(base);
    assert.match(mod, /appBasePath:\s*process\.env\.APP_BASE_PATH/);
    assert.match(mod, /basePath:\s*process\.env\.LOOM_BASE_PATH\s*\|\|\s*undefined/);
  });

  it('prefixes isNestOwnedPath with APP_BASE_PATH in main.ts', () => {
    const main = generateMain(base);
    assert.match(main, /APP_BASE_PATH/);
    assert.match(main, /isNestOwnedPath/);
    assert.match(main, /appBase/);
    // Template-literal cooking must not strip regex escapes into //$/ (invalid TS).
    assert.match(main, /\.replace\(\/\\\/\$\/,\s*''\)/);
    assert.doesNotMatch(main, /\.replace\(\/\/\$\/,/);
  });

  it('wires Nuxt baseURL from APP_BASE_PATH', () => {
    const config = generateNuxtConfig(base);
    assert.match(config, /APP_BASE_PATH/);
    assert.match(config, /baseURL:\s*appBaseURL/);
    assert.match(config, /apiMount/);
  });

  it('wires Vite base from APP_BASE_PATH', () => {
    const config = generateViteConfig({
      ...base,
      frontend: 'vite-react',
    });
    assert.match(config, /APP_BASE_PATH/);
    assert.match(config, /base:\s*viteBase/);
  });

  it('syncs Angular baseHref via --sync instead of ng serve --base-href', () => {
    const helper = generateAngularBasePathHelper();
    assert.match(helper, /syncAngularBaseHref/);
    assert.match(helper, /--sync/);
    assert.match(helper, /buildOptions\.baseHref\s*=\s*baseHref/);
    assert.doesNotMatch(helper, /--base-href/);
  });
});
