import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, switchMap } from 'rxjs';
import { runWithLoomAuth, type LoomAuthUser } from '../core/auth.js';
import type { LoomModuleOptions } from '../core/types.js';
import { LOOM_OPTIONS } from '../core/types.js';
import { LoomAuthService } from './loom-auth.service.js';
import { LOOM_PUBLIC_KEY } from './loom-auth.decorators.js';

type HttpRequest = {
  headers?: Record<string, unknown>;
  cookies?: Record<string, string>;
  loomUser?: LoomAuthUser | null;
};

/**
 * API auth context: resolve session, 401 when missing, run handler in ALS.
 * Use on JSON controllers (admin HTML uses {@link LoomAuthInterceptor} instead).
 */
@Injectable()
export class LoomAuthContextInterceptor implements NestInterceptor {
  constructor(
    private readonly auth: LoomAuthService,
    private readonly reflector: Reflector,
    @Inject(LOOM_OPTIONS) private readonly options: LoomModuleOptions,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!isApiEnabled(this.options)) {
      throw new NotFoundException('Loom API is disabled');
    }

    const http = context.switchToHttp();
    const req = http.getRequest<HttpRequest>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(LOOM_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!this.auth.enabled) {
      return new Observable((subscriber) => {
        runWithLoomAuth(null, () => {
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
      });
    }

    return from(this.auth.resolveUserFromRequest(req)).pipe(
      switchMap((user) => {
        req.loomUser = user;
        if (!user && !isPublic) {
          throw new UnauthorizedException('Authentication required');
        }
        return new Observable((subscriber) => {
          runWithLoomAuth(user, () => {
            next.handle().subscribe({
              next: (value) => subscriber.next(value),
              error: (err) => subscriber.error(err),
              complete: () => subscriber.complete(),
            });
          });
        });
      }),
    );
  }
}

function isApiEnabled(options: LoomModuleOptions): boolean {
  const api = options.api;
  if (api === false) return false;
  if (api && typeof api === 'object' && api.enabled === false) return false;
  return true;
}

