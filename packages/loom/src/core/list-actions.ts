import type { ActionConfig } from './actions.js';
import { bulkDeleteAction, exportAction } from './actions.js';
import type { ResourceMeta } from './types.js';
import { can } from './abilities.js';
import type { LoomAuthUser } from './auth.js';

export function resolveListActions(
  meta: ResourceMeta,
  basePath: string,
  user: LoomAuthUser | null,
  authEnabled: boolean,
  abilities: {
    canDelete: boolean;
    canViewAny: boolean;
  },
): { headerActions: ActionConfig[]; bulkActions: ActionConfig[]; bulkEnabled: boolean } {
  const headerActions = meta.actions
    .filter((action) => action.placement === 'header')
    .map((action) => resolveActionUrl(action, basePath, meta.slug));

  const bulkActions = meta.actions
    .filter((action) => action.placement === 'bulk')
    .map((action) => resolveActionUrl(action, basePath, meta.slug));

  if (canExport(user, authEnabled, meta.slug, abilities.canViewAny)) {
    const hasExport = headerActions.some((action) => action.name === 'export');
    if (!hasExport) {
      headerActions.push(resolveActionUrl(exportAction().build(), basePath, meta.slug));
    }
  }

  if (abilities.canDelete && !bulkActions.some((action) => action.name === 'delete')) {
    bulkActions.push(resolveActionUrl(bulkDeleteAction().build(), basePath, meta.slug));
  }

  return {
    headerActions,
    bulkActions,
    bulkEnabled: bulkActions.length > 0,
  };
}

export function canExport(
  user: LoomAuthUser | null,
  authEnabled: boolean,
  slug: string,
  canViewAny: boolean,
): boolean {
  if (!authEnabled) return canViewAny;
  if (!user) return false;
  return can(user, `${slug}:export`) || can(user, `${slug}:*`) || can(user, '*') || canViewAny;
}

function resolveActionUrl(
  action: ActionConfig,
  basePath: string,
  slug: string,
): ActionConfig {
  if (action.url === '__loom_export__') {
    return { ...action, url: `${basePath}/${slug}/export?format=csv` };
  }
  if (action.url === '__loom_bulk_delete__') {
    return { ...action, url: `${basePath}/${slug}/bulk` };
  }
  return action;
}

export function resourceHasMediaFields(meta: ResourceMeta): boolean {
  return meta.fields.some((field) => field.type === 'file' || field.type === 'image');
}
