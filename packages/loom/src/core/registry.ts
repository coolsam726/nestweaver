import { groupIcon } from './menu.js';
import type { LoomAuthUser } from './auth.js';
import type { ResourceClass, ResourceMeta } from './types.js';

export class ResourceRegistry {
  private readonly resources = new Map<string, ResourceMeta>();
  private readonly classes = new Map<string, ResourceClass>();

  constructor(resourceClasses: ResourceClass[]) {
    for (const resourceClass of resourceClasses) {
      const meta = resourceClass.configure();
      if (this.resources.has(meta.slug)) {
        throw new Error(`Duplicate Loom resource slug: ${meta.slug}`);
      }
      this.resources.set(meta.slug, meta);
      this.classes.set(meta.slug, resourceClass);
    }
  }

  all(): ResourceMeta[] {
    return [...this.resources.values()];
  }

  resourceClass(slug: string): ResourceClass | undefined {
    return this.classes.get(slug);
  }

  requireClass(slug: string): ResourceClass {
    const resourceClass = this.resourceClass(slug);
    if (!resourceClass) {
      throw new Error(`Unknown Loom resource: ${slug}`);
    }
    return resourceClass;
  }

  navigationGroups(user?: LoomAuthUser | null): Array<{ name: string; icon?: string; items: ResourceMeta[] }> {
    const groups = new Map<string, ResourceMeta[]>();
    for (const meta of this.all()) {
      if (user) {
        const resourceClass = this.classes.get(meta.slug);
        const allowed = resourceClass?.canAccess?.(user) ?? resourceClass?.canViewAny?.(user) ?? true;
        if (!allowed) continue;
      }
      const group = meta.navigationGroup ?? 'General';
      const items = groups.get(group) ?? [];
      items.push(meta);
      groups.set(group, items);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => ({
        name,
        icon: groupIcon(name, items.find((item) => item.icon)?.icon),
        items: items.sort((a, b) => a.label.localeCompare(b.label)),
      }));
  }

  get(slug: string): ResourceMeta | undefined {
    return this.resources.get(slug);
  }

  require(slug: string): ResourceMeta {
    const meta = this.get(slug);
    if (!meta) {
      throw new Error(`Unknown Loom resource: ${slug}`);
    }
    return meta;
  }
}
