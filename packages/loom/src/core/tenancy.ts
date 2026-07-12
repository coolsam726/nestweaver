import type { LoomAuthUser } from './auth.js';
import { isAdmin } from './abilities.js';
import type { LoomQueryScope } from './policy.js';
import type { ResourceMeta } from './types.js';

export type LoomTenancyConfig = {
  /** Enable company tenancy (default true when `tenancy` object is set) */
  enabled?: boolean;
  /** FK field on tenant-scoped records (default `companyId`) */
  companyField?: string;
  /** Resource slug for the companies catalog (default `companies`) */
  companyResource?: string;
  /**
   * Optional user field holding allowed company ids (array / JSON / comma list).
   * When unset, non-admins may only use their home `companyIdField` value.
   */
  membershipField?: string;
  /** Label field on company records for the switcher (default `name`) */
  companyLabelField?: string;
};

export function tenancyEnabled(
  tenancy: false | LoomTenancyConfig | undefined,
): tenancy is LoomTenancyConfig {
  if (tenancy === false || tenancy == null) return false;
  return tenancy.enabled !== false;
}

export function tenancyCompanyField(config?: LoomTenancyConfig): string {
  return config?.companyField ?? 'companyId';
}

export function tenancyCompanyResource(config?: LoomTenancyConfig): string {
  return config?.companyResource ?? 'companies';
}

/** Resource opts into company scoping via `companyScoped` / `companyField`. */
export function resourceCompanyField(
  meta: ResourceMeta,
  config?: LoomTenancyConfig,
): string | null {
  if (meta.companyField) return meta.companyField;
  if (meta.companyScoped) return config?.companyField ?? 'companyId';
  return null;
}

/**
 * List/IDOR scope for the active company.
 * Admins with no active company (session "all") are unscoped.
 */
export function companyScopeForUser(
  user: LoomAuthUser | null | undefined,
  companyField: string,
): LoomQueryScope | undefined {
  if (!user) return { equals: { [companyField]: '__loom_no_company__' } };
  if (isAdmin(user) && !user.companyId) return undefined;
  if (!user.companyId) {
    return { equals: { [companyField]: '__loom_no_company__' } };
  }
  return { equals: { [companyField]: user.companyId } };
}

export function recordMatchesCompany(
  record: Record<string, unknown>,
  companyField: string,
  companyId: string | undefined,
  user: LoomAuthUser | null | undefined,
): boolean {
  if (user && isAdmin(user) && !companyId) return true;
  if (!companyId) return false;
  const value = record[companyField];
  if (value == null) return false;
  return String(value) === String(companyId);
}

/** Merge equality scopes (later keys win on conflict). */
export function mergeQueryScopes(
  ...scopes: Array<LoomQueryScope | undefined>
): LoomQueryScope | undefined {
  const equals: Record<string, unknown> = {};
  let any = false;
  for (const scope of scopes) {
    if (!scope?.equals) continue;
    any = true;
    Object.assign(equals, scope.equals);
  }
  return any ? { equals } : undefined;
}

/** Session marker for admin "all companies" (unscoped). */
export const LOOM_ALL_COMPANIES = '';

export function membershipCompanyIds(
  record: Record<string, unknown>,
  homeCompanyId: string | undefined,
  membershipField?: string,
): string[] {
  const ids = new Set<string>();
  if (homeCompanyId) ids.add(String(homeCompanyId));
  if (!membershipField) return [...ids];
  const raw = record[membershipField];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item != null && item !== '') ids.add(String(item));
    }
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item != null && item !== '') ids.add(String(item));
        }
      } else {
        for (const part of raw.split(',')) {
          const trimmed = part.trim();
          if (trimmed) ids.add(trimmed);
        }
      }
    } catch {
      for (const part of raw.split(',')) {
        const trimmed = part.trim();
        if (trimmed) ids.add(trimmed);
      }
    }
  }
  return [...ids];
}
