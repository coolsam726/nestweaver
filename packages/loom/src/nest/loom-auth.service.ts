import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import type { LoomAdapter } from '../adapters/adapter.js';
import { recordIdFrom } from '../adapters/adapter.js';
import {
  buildSessionCookie,
  getRequestCookie,
  hashPassword,
  isPasswordHashed,
  signSession,
  toAuthUser,
  verifyPassword,
  verifySession,
  type LoomAuthOptions,
  type LoomAuthUser,
} from '../core/auth.js';
import { LOOM_ABILITIES } from '../core/abilities.js';
import { relationIdsFromValue } from '../core/relations.js';
import { ResourceRegistry } from '../core/registry.js';
import {
  LOOM_RBAC,
  type LoomRbacStore,
  createLoomRbacStore,
  createNoopRbacStore,
} from '../core/rbac-store.js';
import type { LoomModuleOptions } from '../core/types.js';
import { LOOM_ADAPTER, LOOM_OPTIONS, LOOM_REGISTRY } from '../core/types.js';

@Injectable()
export class LoomAuthService implements OnModuleInit {
  private readonly logger = new Logger(LoomAuthService.name);
  private rbac: LoomRbacStore;

  constructor(
    @Inject(LOOM_OPTIONS) private readonly options: LoomModuleOptions,
    @Inject(LOOM_ADAPTER) private readonly adapter: LoomAdapter,
    @Inject(LOOM_REGISTRY) private readonly registry: ResourceRegistry,
    @Optional() @Inject(LOOM_RBAC) rbacStore?: LoomRbacStore,
  ) {
    this.rbac =
      rbacStore ??
      (options.orm && options.dataSource !== undefined
        ? createLoomRbacStore(options.orm, options.dataSource)
        : createNoopRbacStore());
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled || this.options.auth?.skipRbacSync) {
      await this.seedAdminIfNeeded();
      return;
    }
    try {
      await this.syncPermissionsAndRoles();
    } catch (error) {
      this.logger.warn(
        `RBAC sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await this.seedAdminIfNeeded();
  }

  get enabled(): boolean {
    return Boolean(this.options.auth?.secret);
  }

  get authOptions(): LoomAuthOptions | undefined {
    return this.options.auth;
  }

  get loginPath(): string {
    return `${this.options.basePath ?? '/admin'}/login`;
  }

  get logoutPath(): string {
    return `${this.options.basePath ?? '/admin'}/logout`;
  }

  isPublicPath(pathname: string): boolean {
    const base = (this.options.basePath ?? '/admin').replace(/\/$/, '');
    const path = pathname.split('?')[0] ?? pathname;
    if (path === `${base}/login` || path.endsWith('/login')) return true;
    if (path.includes('/assets/')) return true;
    if (path === `${base}/logout` || path.endsWith('/logout')) return true;
    return false;
  }

  async resolveUserFromRequest(req: {
    headers?: Record<string, unknown>;
    cookies?: Record<string, string>;
  }): Promise<LoomAuthUser | null> {
    if (!this.enabled || !this.options.auth) return null;
    const cookieName = this.options.auth.cookieName ?? 'loom_session';
    const token = getRequestCookie(req, cookieName);
    const session = verifySession(token, this.options.auth.secret);
    if (!session) return null;
    return this.findUserById(session.sub);
  }

  async findUserById(id: string): Promise<LoomAuthUser | null> {
    if (!this.options.auth) return null;
    const meta = this.userMeta();
    try {
      const record = await this.adapter.findOne(meta, id);
      return this.hydrateAuthUser(record);
    } catch {
      return null;
    }
  }

  async authenticate(email: string, password: string): Promise<{
    user: LoomAuthUser;
    cookie: string;
  } | null> {
    if (!this.options.auth) return null;
    const auth = this.options.auth;
    const emailField = auth.emailField ?? 'email';
    const passwordField = auth.passwordField ?? 'password';
    const meta = this.userMeta();
    const normalizedEmail = email.trim().toLowerCase();
    const record =
      (await this.adapter.findFirst(meta, { [emailField]: normalizedEmail })) ??
      (await this.findUserByEmailFallback(normalizedEmail));
    if (!record) return null;

    const stored = String(record[passwordField] ?? '');
    const ok = await verifyPassword(password, stored);
    if (!ok) return null;

    const user = await this.hydrateAuthUser(record);
    if (!user) return null;

    if (stored && !isPasswordHashed(stored)) {
      try {
        await this.adapter.update(meta, recordIdFrom(record), {
          [passwordField]: await hashPassword(password),
        });
      } catch {
        // Best-effort upgrade
      }
    }

    const maxAgeMs = auth.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000;
    const token = signSession(
      { sub: user.id, exp: Date.now() + maxAgeMs },
      auth.secret,
    );
    return {
      user,
      cookie: buildSessionCookie(auth, token),
    };
  }

  clearSessionCookie(): string {
    if (!this.options.auth) {
      return 'loom_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax';
    }
    return buildSessionCookie(this.options.auth, null);
  }

  private async hydrateAuthUser(
    record: Record<string, unknown>,
  ): Promise<LoomAuthUser | null> {
    if (!this.options.auth) return null;
    const base = toAuthUser(record, this.options.auth);
    if (!base) return null;

    const roleIdsField = this.options.auth.roleIdsField ?? 'roleIds';
    const roleIds = [...relationIdsFromValue(record[roleIdsField])];

    // Legacy single role string → treat as role slug until migrated
    if (roleIds.length === 0 && base.role) {
      roleIds.push(String(base.role));
    }

    try {
      const loaded = await this.rbac.loadPermissionNamesForUser(base.id, roleIds);
      base.roles = loaded.roles.length > 0 ? loaded.roles : roleIds;
      base.permissions = loaded.permissions;
      if (base.permissions.includes('*') && !base.roles.includes('admin')) {
        // keep roles as-is
      }
      // Fallback: legacy admin role column with no RBAC rows yet
      if (
        (base.permissions?.length ?? 0) === 0 &&
        (base.role === 'admin' || roleIds.includes('admin'))
      ) {
        base.permissions = ['*'];
        base.roles = ['admin'];
      }
    } catch {
      if (base.role === 'admin') {
        base.permissions = ['*'];
        base.roles = ['admin'];
      }
    }

    return base;
  }

  private async syncPermissionsAndRoles(): Promise<void> {
    const names = new Set<string>(['*']);
    const labels = new Map<string, string>();

    for (const meta of this.registry.all()) {
      names.add(`${meta.slug}:*`);
      for (const ability of LOOM_ABILITIES) {
        names.add(`${meta.slug}:${ability}`);
      }
      for (const custom of meta.customPermissions ?? []) {
        names.add(custom.name);
        if (custom.label) labels.set(custom.name, custom.label);
      }
    }
    for (const extra of this.options.auth?.extraPermissions ?? []) {
      names.add(extra);
    }

    const permissionIdsByName = new Map<string, string>();
    for (const name of names) {
      const [resource, ability] = name === '*' ? ['*', '*'] : name.split(':');
      const record = await this.rbac.upsertPermission({
        name,
        resource: resource || '*',
        ability: ability || '*',
        label: labels.get(name),
      });
      permissionIdsByName.set(name, record.id || name);
    }

    const allIds = [...permissionIdsByName.values()];
    const admin = await this.rbac.upsertRole({
      name: 'Admin',
      slug: 'admin',
      description: 'Full access',
      permissionIds: [permissionIdsByName.get('*') ?? '*'],
    });

    const rbacSlugs = new Set(['users', 'roles', 'permissions']);
    const editorPerms: string[] = [];
    const viewerPerms: string[] = [];
    for (const name of names) {
      if (name === '*' || name.endsWith(':*') && name !== '*') {
        const resource = name.split(':')[0];
        if (resource && rbacSlugs.has(resource)) continue;
      }
      const [resource, ability] = name.split(':');
      if (!resource || rbacSlugs.has(resource)) continue;
      if (ability === 'viewAny' || ability === 'view') {
        viewerPerms.push(permissionIdsByName.get(name) ?? name);
      }
      if (['viewAny', 'view', 'create', 'edit', 'delete', '*'].includes(ability)) {
        editorPerms.push(permissionIdsByName.get(name) ?? name);
      }
    }

    const existingEditor = await this.rbac.findRoleBySlug('editor');
    await this.rbac.upsertRole({
      name: 'Editor',
      slug: 'editor',
      description: 'CRUD on application resources',
      permissionIds:
        existingEditor && existingEditor.permissionIds.length > 0
          ? existingEditor.permissionIds
          : editorPerms,
    });

    const existingViewer = await this.rbac.findRoleBySlug('viewer');
    await this.rbac.upsertRole({
      name: 'Viewer',
      slug: 'viewer',
      description: 'Read-only access',
      permissionIds:
        existingViewer && existingViewer.permissionIds.length > 0
          ? existingViewer.permissionIds
          : viewerPerms,
    });

    // Ensure admin always has *
    if (admin.permissionIds.length === 0) {
      await this.rbac.setRolePermissions(admin.id, [
        permissionIdsByName.get('*') ?? '*',
      ]);
    }

    this.logger.log(`Synced ${names.size} Loom permissions (${allIds.length} ids)`);
  }

  private async seedAdminIfNeeded(): Promise<void> {
    const auth = this.options.auth;
    const seed = auth?.seedAdmin;
    if (!auth?.secret || !seed?.email || !seed?.password) return;

    try {
      const meta = this.userMeta();
      const emailField = auth.emailField ?? 'email';
      const passwordField = auth.passwordField ?? 'password';
      const nameField = auth.nameField ?? 'name';
      const activeField = auth.activeField ?? 'active';
      const roleIdsField = auth.roleIdsField ?? 'roleIds';
      const email = seed.email.trim().toLowerCase();
      const roleSlug = seed.role ?? 'admin';

      const existing =
        (await this.adapter.findFirst(meta, { [emailField]: email })) ??
        (await this.findUserByEmailFallback(email));
      if (existing) {
        await this.rbac.assignRoleToUser(recordIdFrom(existing), roleSlug);
        return;
      }

      const adminRole = await this.rbac.findRoleBySlug(roleSlug);
      const created = await this.adapter.create(meta, {
        [nameField]: seed.name?.trim() || 'Admin',
        [emailField]: email,
        [passwordField]: await hashPassword(seed.password),
        [activeField]: true,
        [roleIdsField]: adminRole ? [adminRole.id] : [roleSlug],
      });
      await this.rbac.assignRoleToUser(recordIdFrom(created), roleSlug);
      this.logger.log(`Seeded Loom admin user ${email} (role: ${roleSlug})`);
    } catch (error) {
      this.logger.warn(
        `Could not seed Loom admin user: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private userMeta() {
    const slug = this.options.auth?.userResource ?? 'users';
    return this.registry.require(slug);
  }

  private async findUserByEmailFallback(
    email: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.options.auth) return null;
    const emailField = this.options.auth.emailField ?? 'email';
    const meta = this.userMeta();
    const result = await this.adapter.list(meta, {
      page: 1,
      perPage: 50,
      search: email,
    });
    return (
      result.items.find(
        (item) => String(item[emailField] ?? '').toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  }
}
