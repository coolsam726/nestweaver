import type { LoomModuleOptions } from './types.js';

/**
 * Refuse to boot an open admin panel in production unless explicitly opted in.
 */
export function assertLoomProductionAuth(options: LoomModuleOptions): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;
  if (options.resources.length === 0) return;
  if (options.allowAnonymousAdmin) return;
  if (options.auth?.secret?.trim()) return;

  throw new Error(
    'Loom: auth.secret is required in production when resources are registered. ' +
      'Set LOOM_AUTH_SECRET / auth.secret, or set allowAnonymousAdmin: true to opt out (not recommended).',
  );
}
