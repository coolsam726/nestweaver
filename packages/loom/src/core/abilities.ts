import type { LoomAbility, LoomAuthUser } from './auth.js';

/**
 * Check a full permission name (`companies:viewAny`, `companies:*`, `*`).
 */
export function can(
  user: LoomAuthUser | null | undefined,
  permission: string,
): boolean {
  if (!user) return false;
  const permissions = user.permissions ?? [];
  if (permissions.includes('*') || permissions.includes(permission)) {
    return true;
  }
  const [resource, ability] = permission.split(':');
  if (!resource || !ability) return false;
  if (permissions.includes(`${resource}:*`)) return true;
  if (ability !== '*' && permissions.includes(`*:${ability}`)) return true;
  return false;
}

export function isAdmin(user: LoomAuthUser | null | undefined): boolean {
  if (!user) return false;
  if (can(user, '*')) return true;
  return Boolean(user.roles?.includes('admin'));
}

export function userHasPermission(
  user: LoomAuthUser | null | undefined,
  slug: string,
  ability: LoomAbility,
): boolean {
  if (!user) return false;
  return (
    can(user, '*') ||
    can(user, `${slug}:*`) ||
    can(user, `${slug}:${ability}`) ||
    can(user, `*:${ability}`)
  );
}

export function assertCan(
  user: LoomAuthUser | null | undefined,
  slug: string,
  ability: LoomAbility,
  resourceCan?: (user: LoomAuthUser) => boolean,
): void {
  if (!user) {
    throw new LoomAuthorizationError('Authentication required');
  }
  if (resourceCan) {
    if (!resourceCan(user)) {
      throw new LoomAuthorizationError(`You are not allowed to ${ability} ${slug}`);
    }
    return;
  }
  if (!userHasPermission(user, slug, ability)) {
    throw new LoomAuthorizationError(`You are not allowed to ${ability} ${slug}`);
  }
}

/** True if the user has any of the named permissions (wildcard-aware). */
export function canAny(
  user: LoomAuthUser | null | undefined,
  permissions: string[],
): boolean {
  return permissions.some((p) => can(user, p));
}

export class LoomAuthorizationError extends Error {
  readonly statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'LoomAuthorizationError';
  }
}

export const LOOM_ABILITIES: LoomAbility[] = [
  'viewAny',
  'view',
  'create',
  'edit',
  'delete',
];
