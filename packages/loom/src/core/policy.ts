import type { LoomAbility, LoomAuthUser } from './auth.js';
import { can, userHasPermission } from './abilities.js';
import { LoomAuthorizationError } from './abilities.js';

/** Equality filters applied to list queries (record-level scoping). */
export interface LoomQueryScope {
  equals?: Record<string, unknown>;
}

export type PolicyClass = {
  new (): unknown;
  viewAny?(user: LoomAuthUser): boolean;
  view?(user: LoomAuthUser, record: Record<string, unknown>): boolean;
  create?(user: LoomAuthUser): boolean;
  edit?(user: LoomAuthUser, record: Record<string, unknown>): boolean;
  delete?(user: LoomAuthUser, record: Record<string, unknown>): boolean;
  scopeList?(user: LoomAuthUser): LoomQueryScope | undefined;
  /** When set, create() stamps this field with the current user id */
  ownerField?: string;
};

/**
 * Filament-style policy base.
 * Override methods for record rules; default is permission-string only (no scope).
 */
export abstract class Policy {
  static ownerField?: string;

  static viewAny(user: LoomAuthUser, resource = 'resource'): boolean {
    return userHasPermission(user, resource, 'viewAny');
  }

  static view(
    user: LoomAuthUser,
    _record: Record<string, unknown>,
    resource = 'resource',
  ): boolean {
    return userHasPermission(user, resource, 'view');
  }

  static create(user: LoomAuthUser, resource = 'resource'): boolean {
    return userHasPermission(user, resource, 'create');
  }

  static edit(
    user: LoomAuthUser,
    _record: Record<string, unknown>,
    resource = 'resource',
  ): boolean {
    return userHasPermission(user, resource, 'edit');
  }

  static delete(
    user: LoomAuthUser,
    _record: Record<string, unknown>,
    resource = 'resource',
  ): boolean {
    return userHasPermission(user, resource, 'delete');
  }

  static scopeList(_user: LoomAuthUser): LoomQueryScope | undefined {
    return undefined;
  }
}

/** True when record[ownerField] matches the current user id. */
export function ownedBy(
  user: LoomAuthUser,
  record: Record<string, unknown>,
  ownerField = 'createdById',
): boolean {
  const owner = record[ownerField] ?? record.userId ?? record.createdBy;
  if (owner == null) return false;
  return String(owner) === String(user.id);
}

export function resolvePolicy(
  policy: PolicyClass | undefined,
  slug: string,
): PolicyClass {
  if (policy) return policy;
  // Default: permission-only policy bound to slug
  return class DefaultPolicy extends Policy {
    static override viewAny(user: LoomAuthUser) {
      return userHasPermission(user, slug, 'viewAny');
    }
    static override view(user: LoomAuthUser, record: Record<string, unknown>) {
      return userHasPermission(user, slug, 'view');
    }
    static override create(user: LoomAuthUser) {
      return userHasPermission(user, slug, 'create');
    }
    static override edit(user: LoomAuthUser, record: Record<string, unknown>) {
      return userHasPermission(user, slug, 'edit');
    }
    static override delete(user: LoomAuthUser, record: Record<string, unknown>) {
      return userHasPermission(user, slug, 'delete');
    }
  };
}

export function scopeList(
  policy: PolicyClass | undefined,
  user: LoomAuthUser | null | undefined,
  slug: string,
): LoomQueryScope | undefined {
  if (!user) return undefined;
  const resolved = resolvePolicy(policy, slug);
  return resolved.scopeList?.(user);
}

export function assertPolicy(
  policy: PolicyClass | undefined,
  ability: LoomAbility,
  user: LoomAuthUser | null | undefined,
  slug: string,
  record?: Record<string, unknown>,
): void {
  if (!user) {
    throw new LoomAuthorizationError('Authentication required');
  }
  const resolved = resolvePolicy(policy, slug);
  let ok = false;
  if (ability === 'viewAny') {
    ok = resolved.viewAny?.(user) ?? userHasPermission(user, slug, ability);
  } else if (ability === 'create') {
    ok = resolved.create?.(user) ?? userHasPermission(user, slug, ability);
  } else if (ability === 'view') {
    ok =
      resolved.view?.(user, record ?? {}) ??
      userHasPermission(user, slug, ability);
  } else if (ability === 'edit') {
    ok =
      resolved.edit?.(user, record ?? {}) ??
      userHasPermission(user, slug, ability);
  } else {
    ok =
      resolved.delete?.(user, record ?? {}) ??
      userHasPermission(user, slug, ability);
  }
  if (!ok) {
    throw new LoomAuthorizationError(`You are not allowed to ${ability} ${slug}`);
  }
}

export { can };
