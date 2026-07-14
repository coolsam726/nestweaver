import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { LoomAuthService, setResponseCookie } from '@nodeweaver/loom';
import type { LoomAuthUser } from '@nodeweaver/loom';

type HttpRequest = {
  url?: string;
  originalUrl?: string;
  method?: string;
  headers?: Record<string, unknown>;
  cookies?: Record<string, string>;
  loomUser?: LoomAuthUser | null;
};

type HttpResponse = {
  statusCode?: number;
  setHeader?: (name: string, value: string) => void;
  appendHeader?: (name: string, value: string) => void;
  header?: (name: string, value: string) => unknown;
  hijacked?: boolean;
  sent?: boolean;
  raw?: { headersSent?: boolean };
};

/**
 * Attach the Loom session user (and CSRF cookie) to the request.
 * Controllers that use `@Res()` should call {@link requireUser} so redirects
 * do not fight Nest's ForbiddenException when a guard returns false.
 */
@Injectable()
export class SiteAuthGuard implements CanActivate {
  constructor(private readonly auth: LoomAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<HttpRequest>();
    const res = http.getResponse<HttpResponse>();

    if (!this.auth.enabled) {
      return true;
    }

    const user = await this.auth.resolveUserFromRequest(req);
    req.loomUser = user;

    const method = (req.method ?? 'GET').toUpperCase();
    const safe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    const csrf = this.auth.ensureCsrf(req, safe);
    if (csrf.setCookie) {
      setResponseCookie(res, csrf.setCookie);
    }

    return this.requireUser(req, res);
  }

  /** Redirect to /login when unauthenticated. Returns false if redirected. */
  requireUser(req: HttpRequest, res: HttpResponse): boolean {
    if (!this.auth.enabled || req.loomUser) {
      return true;
    }
    const path = (req.originalUrl ?? req.url ?? '/').split('?')[0] || '/';
    redirect(res, `/login?redirect=${encodeURIComponent(path)}`);
    return false;
  }
}

function redirect(res: HttpResponse, url: string): void {
  if (typeof (res as { redirect?: unknown }).redirect === 'function') {
    const redirectFn = (
      res as {
        redirect: ((status: number, url: string) => unknown) | ((url: string, status?: number) => unknown);
      }
    ).redirect;
    try {
      (redirectFn as (status: number, url: string) => unknown)(302, url);
      return;
    } catch {
      /* continue */
    }
    try {
      (redirectFn as (url: string, status?: number) => unknown)(url, 302);
      return;
    } catch {
      /* continue */
    }
  }
  if (typeof res.setHeader === 'function') {
    res.statusCode = 302;
    res.setHeader('Location', url);
    (res as { send?: (body?: unknown) => unknown }).send?.('');
  }
}
