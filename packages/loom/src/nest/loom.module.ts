import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import type { InjectionToken } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { createNoopAdapter, createLoomAdapter, type LoomAdapter } from '../adapters/adapter.js';
import { assertLoomDeprecations, assertLoomProductionAuth } from '../core/assert-options.js';
import {
  defaultAdminBasePath,
  defaultCookiePath,
  joinAppPath,
  nestControllerPath,
  normalizeAppBasePath,
} from '../core/app-path.js';
import { ResourceRegistry } from '../core/registry.js';
import { createLoomRbacStore, createNoopRbacStore, LOOM_RBAC } from '../core/rbac-store.js';
import { resolveStorageAdapter } from '../core/storage.js';
import type { LoomModuleOptions } from '../core/types.js';
import { LOOM_ADAPTER, LOOM_OPTIONS, LOOM_REGISTRY, LOOM_STORAGE } from '../core/types.js';
import {
  createLoomAuthController,
  createLoomAuthLegacyRedirectController,
} from './loom-auth.controller.js';
import { createLoomController } from './loom.controller.js';
import { createLoomApiController } from './loom-api.controller.js';
import { LoomService } from './loom.service.js';
import { LoomViewService } from './loom-view.service.js';
import { LoomAuthService } from './loom-auth.service.js';
import { LoomAuthInterceptor } from './loom-auth.interceptor.js';
import { LoomAuthContextInterceptor } from './loom-auth-context.interceptor.js';
import { LoomAbilityGuard, LoomAuthGuard } from './loom-auth.guard.js';
import { LoomForbiddenExceptionFilter } from './loom-forbidden.filter.js';

function resolveAdapter(options: LoomModuleOptions): LoomAdapter {
  if (options.adapter) {
    return options.adapter;
  }
  if (options.resources.length === 0) {
    return createNoopAdapter();
  }
  if (!options.orm || options.dataSource === undefined) {
    throw new Error('Loom resources require `orm` and `dataSource`');
  }
  return createLoomAdapter(options.orm, options.dataSource);
}

function resolveRbac(options: LoomModuleOptions) {
  if (!options.orm || options.dataSource === undefined) {
    return createNoopRbacStore();
  }
  return createLoomRbacStore(options.orm, options.dataSource);
}

function resolveApiPrefix(options: LoomModuleOptions): string | null {
  const api = options.api;
  if (api === false) return null;
  if (api && typeof api === 'object' && api.enabled === false) return null;

  const appBase = normalizeAppBasePath(options.appBasePath);
  let relative = 'api/loom';

  if (api && typeof api === 'object' && api.prefix) {
    const raw = api.prefix.replace(/^\//, '').replace(/\/$/, '') || 'api/loom';
    const appCtrl = nestControllerPath(appBase || '/');
    if (appCtrl && (raw === appCtrl || raw.startsWith(`${appCtrl}/`))) {
      return raw;
    }
    relative = raw;
  } else if (api && typeof api === 'object' && api.version) {
    const version = api.version.replace(/^\//, '').replace(/\/$/, '');
    relative = version ? `api/loom/${version}` : 'api/loom';
  }

  return nestControllerPath(joinAppPath(appBase, relative));
}

function resolveStorage(options: LoomModuleOptions) {
  return resolveStorageAdapter(options.storage);
}

function resolveAdminBasePath(options: LoomModuleOptions): string {
  const appBase = normalizeAppBasePath(options.appBasePath);
  if (!options.basePath) {
    return defaultAdminBasePath(appBase);
  }
  const explicit = joinAppPath('', String(options.basePath).replace(/^\//, ''));
  // joinAppPath('', 'admin') => '/admin'; joinAppPath('', 'my-app/admin') => '/my-app/admin'
  const normalizedExplicit = explicit.startsWith('/')
    ? explicit
    : joinAppPath('', explicit);
  if (!appBase) {
    return normalizedExplicit === '/' ? '/admin' : normalizedExplicit;
  }
  if (normalizedExplicit === appBase || normalizedExplicit.startsWith(`${appBase}/`)) {
    return normalizedExplicit;
  }
  return joinAppPath(appBase, normalizedExplicit.replace(/^\//, ''));
}

function normalizeOptions(options: LoomModuleOptions): LoomModuleOptions {
  assertLoomProductionAuth(options);
  assertLoomDeprecations(options);

  const appBasePath = normalizeAppBasePath(options.appBasePath);
  const basePath = resolveAdminBasePath({ ...options, appBasePath });
  const cookiePath = defaultCookiePath(appBasePath);
  const auth = options.auth
    ? {
        ...options.auth,
        cookiePath: options.auth.cookiePath ?? cookiePath,
      }
    : options.auth;

  return {
    ...options,
    appBasePath: appBasePath || undefined,
    basePath,
    auth,
  };
}

function buildLoomModule(
  options: LoomModuleOptions,
  asyncProviders: Provider[],
): DynamicModule {
  const normalized = normalizeOptions(options);
  const appBase = normalizeAppBasePath(normalized.appBasePath);
  const basePath = normalized.basePath ?? defaultAdminBasePath(appBase);
  const LoomController = createLoomController(basePath);
  const controllers: Type<unknown>[] = [
    createLoomAuthController(appBase) as Type<unknown>,
    createLoomAuthLegacyRedirectController(basePath) as Type<unknown>,
    LoomController as Type<unknown>,
  ];

  const apiPrefix = resolveApiPrefix(normalized);
  if (apiPrefix) {
    controllers.push(createLoomApiController(apiPrefix) as Type<unknown>);
  }

  return {
    module: LoomModule,
    controllers,
    providers: [
      ...asyncProviders,
      { provide: LOOM_ADAPTER, useFactory: resolveAdapter, inject: [LOOM_OPTIONS] },
      {
        provide: LOOM_RBAC,
        useFactory: resolveRbac,
        inject: [LOOM_OPTIONS],
      },
      {
        provide: LOOM_REGISTRY,
        useFactory: (moduleOptions: LoomModuleOptions) =>
          new ResourceRegistry(moduleOptions.resources),
        inject: [LOOM_OPTIONS],
      },
      {
        provide: LOOM_STORAGE,
        useFactory: resolveStorage,
        inject: [LOOM_OPTIONS],
      },
      LoomService,
      LoomViewService,
      LoomAuthService,
      LoomAuthInterceptor,
      LoomAuthContextInterceptor,
      LoomAuthGuard,
      LoomAbilityGuard,
      {
        provide: APP_FILTER,
        useClass: LoomForbiddenExceptionFilter,
      },
    ],
    exports: [
      LoomService,
      LoomAuthService,
      LoomAuthGuard,
      LoomAbilityGuard,
      LoomAuthContextInterceptor,
      LOOM_ADAPTER,
      LOOM_REGISTRY,
      LOOM_RBAC,
      LOOM_STORAGE,
    ],
  };
}

@Module({})
export class LoomModule {
  static forRoot(options: LoomModuleOptions): DynamicModule {
    const normalized = normalizeOptions(options);
    return buildLoomModule(normalized, [
      { provide: LOOM_OPTIONS, useValue: normalized },
    ]);
  }

  /**
   * Async Loom setup. Nest registers controllers when the module is defined —
   * before `useFactory` runs — so **`appBasePath`, `basePath`, and `api` must be set here**
   * (synchronously), not only inside the factory. Values from the factory are
   * still used for everything else (ORM, auth, resources, …).
   */
  static forRootAsync(asyncOptions: {
    imports?: DynamicModule['imports'];
    inject?: InjectionToken[];
    /** App mount prefix (e.g. `/my-app`). Sync — factory-only is ignored for routing. */
    appBasePath?: string;
    /**
     * Admin URL prefix (default `{appBasePath}/admin`).
     * Required here when not using the default — factory `basePath` alone is ignored for routing.
     */
    basePath?: string;
    /**
     * JSON API enablement / prefix / version. Same sync constraint as `basePath`.
     */
    api?: LoomModuleOptions['api'];
    useFactory: (...args: unknown[]) => LoomModuleOptions | Promise<LoomModuleOptions>;
  }): DynamicModule {
    const routeOptions: LoomModuleOptions = {
      resources: [],
      appBasePath: asyncOptions.appBasePath,
      basePath: asyncOptions.basePath,
      api: asyncOptions.api,
    };
    return {
      ...buildLoomModule(routeOptions, [
        {
          provide: LOOM_OPTIONS,
          useFactory: async (...args: unknown[]) => {
            const resolved = await asyncOptions.useFactory(...args);
            return normalizeOptions({
              ...resolved,
              appBasePath: asyncOptions.appBasePath ?? resolved.appBasePath,
              basePath: asyncOptions.basePath ?? resolved.basePath,
              api: asyncOptions.api ?? resolved.api,
            });
          },
          inject: asyncOptions.inject ?? [],
        },
      ]),
      imports: asyncOptions.imports ?? [],
    };
  }
}
