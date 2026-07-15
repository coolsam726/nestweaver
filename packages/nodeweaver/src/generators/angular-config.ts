import type { ScaffoldOptions } from '../types.js';
import { NEST_DEFAULT_PORT, WEB_DEV_DEFAULT_PORT } from '../constants.js';
import { isSsrFrontend } from '../frontend.js';

function formatAllowedHosts(): string {
  const hosts = [
    'localhost',
    '127.0.0.1',
    `localhost:${WEB_DEV_DEFAULT_PORT}`,
    `127.0.0.1:${WEB_DEV_DEFAULT_PORT}`,
    `localhost:${NEST_DEFAULT_PORT}`,
    `127.0.0.1:${NEST_DEFAULT_PORT}`,
  ];

  return hosts.map((host) => `                "${host}"`).join(',\n');
}

export function generateAngularJson(options: ScaffoldOptions): string {
  const ssr = isSsrFrontend(options);
  const allowedHosts = formatAllowedHosts();
  const ssrBuildFields = ssr
    ? `,
            "server": "src/main.server.ts",
            "outputMode": "server",
            "ssr": {
              "entry": "src/server.ts"
            },
            "security": {
              "allowedHosts": [
${allowedHosts}
              ]
            }`
    : '';

  return `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": {
    "packageManager": "pnpm"
  },
  "newProjectRoot": "projects",
  "projects": {
    "web": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "baseHref": "/",
            "polyfills": [
              "zone.js"
            ],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": [
              "src/styles.css"
            ],
            "scripts": []${ssrBuildFields}
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kB",
                  "maximumError": "8kB"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "allowedHosts": [
${allowedHosts}
            ]
          },
          "configurations": {
            "production": {
              "buildTarget": "web:build:production"
            },
            "development": {
              "buildTarget": "web:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n"
        }
      }
    }
  }
}
`;
}

export function generateAngularProxyConf(): string {
  return `const nestOrigin = (
  process.env.API_BASE_SERVER ?? 'http://127.0.0.1:${NEST_DEFAULT_PORT}'
).replace(/\\/api\\/?$/, '');
const { apiMount } = require('./base-path.cjs');

module.exports = {
  [apiMount]: {
    target: nestOrigin,
    secure: false,
    changeOrigin: true,
  },
};
`;
}

/** Syncs APP_BASE_PATH into angular.json and prints the base href. */
export function generateAngularBasePathHelper(): string {
  return `const fs = require('node:fs');
const path = require('node:path');

function normalizeAppBasePath(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '/') return '';
  const withSlash = raw.startsWith('/') ? raw : \`/\${raw}\`;
  return withSlash.replace(/\\/+$/, '');
}

const appBase = normalizeAppBasePath(process.env.APP_BASE_PATH);
const baseHref = appBase ? \`\${appBase}/\` : '/';
const apiMount = appBase ? \`\${appBase}/api\` : '/api';

function syncAngularBaseHref() {
  const angularJsonPath = path.join(__dirname, 'angular.json');
  if (!fs.existsSync(angularJsonPath)) {
    throw new Error(\`angular.json not found at \${angularJsonPath}\`);
  }
  const config = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
  const buildOptions = config?.projects?.web?.architect?.build?.options;
  if (!buildOptions || typeof buildOptions !== 'object') {
    throw new Error('angular.json missing projects.web.architect.build.options');
  }
  buildOptions.baseHref = baseHref;
  fs.writeFileSync(angularJsonPath, \`\${JSON.stringify(config, null, 2)}\\n\`);
}

module.exports = { appBase, baseHref, apiMount, syncAngularBaseHref };

if (require.main === module) {
  if (process.argv.includes('--sync')) {
    syncAngularBaseHref();
  }
  process.stdout.write(baseHref);
}
`;
}

