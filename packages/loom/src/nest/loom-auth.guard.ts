import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { currentLoomUser } from '../core/auth.js';
import { LoomAuthorizationError, assertCan, canAny } from '../core/abilities.js';
import { ResourceRegistry } from '../core/registry.js';
import { LOOM_REGISTRY } from '../core/types.js';
import { LoomAuthService } from './loom-auth.service.js';
import {
  LOOM_ABILITY_KEY,
  LOOM_PERMISSION_KEY,
  LOOM_PUBLIC_KEY,
  type LoomAbilityRequirement,
} from './loom-auth.decorators.js';

type HttpRequest = {
  headers?: Record<string, unknown>;
  cookies?: Record<string, string>;
  loomUser?: import('../core/auth.js').LoomAuthUser | null;
};

/**
 * Resolves the Loom session user onto the request.
 * Pair with {@link LoomAuthContextInterceptor} for ALS.
 */
@Injectable()
export class LoomAuthGuard implements CanActivate {
  constructor(
    private readonly auth: LoomAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<HttpRequest>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(LOOM_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!this.auth.enabled) {
      req.loomUser = null;
      return true;
    }

    const user = await this.auth.resolveUserFromRequest(req);
    req.loomUser = user;

    if (!user && !isPublic) {
      throw new UnauthorizedException('Authentication required');
    }
    return true;
  }
}

/**
 * Enforces `@RequirePermission(...)` (string-first) or legacy `@RequireLoomAbility`.
 */
@Injectable()
export class LoomAbilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOOM_REGISTRY) private readonly registry: ResourceRegistry,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<string[] | undefined>(
      LOOM_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (permissions?.length) {
      const user = currentLoomUser();
      if (!canAny(user, permissions)) {
        throw new ForbiddenException(
          `Missing permission (need one of: ${permissions.join(', ')})`,
        );
      }
      return true;
    }

    const requirement = this.reflector.getAllAndOverride<LoomAbilityRequirement | undefined>(
      LOOM_ABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requirement) return true;

    const user = currentLoomUser();
    const resourceClass = this.registry.resourceClass(requirement.resource);
    const method =
      requirement.ability === 'viewAny'
        ? resourceClass?.canViewAny?.bind(resourceClass)
        : requirement.ability === 'view'
          ? resourceClass?.canView?.bind(resourceClass)
          : requirement.ability === 'create'
            ? resourceClass?.canCreate?.bind(resourceClass)
            : requirement.ability === 'edit'
              ? resourceClass?.canEdit?.bind(resourceClass)
              : resourceClass?.canDelete?.bind(resourceClass);

    try {
      assertCan(
        user,
        requirement.resource,
        requirement.ability,
        method ? (u) => Boolean(method(u)) : undefined,
      );
      return true;
    } catch (error) {
      if (error instanceof LoomAuthorizationError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
