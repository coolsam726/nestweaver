import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LoomAuthService,
  LoomCsrfError,
  LoomService,
  buildBrandingCss,
  loomAdminCssPath,
  loomAlpineJsPath,
  loomUiJsPath,
  setResponseCookies,
  type LoomAuthUser,
} from '@nodeweaver/loom';
import {
  appBaseFromEnv,
  joinAppPath,
  nestControllerPath,
} from '../app-path';
import { SiteViewService } from './site-view.service';

function siteCssPath(): string {
  const candidates = [
    join(process.cwd(), 'views', 'assets', 'site.css'),
    join(process.cwd(), 'apps/api/views', 'assets', 'site.css'),
    join(__dirname, '..', '..', 'views', 'assets', 'site.css'),
    join(__dirname, '..', 'views', 'assets', 'site.css'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  throw new Error(`site.css not found (looked in: ${candidates.join(', ')})`);
}

type SiteReq = {
  url?: string;
  originalUrl?: string;
  method?: string;
  headers?: Record<string, unknown>;
  cookies?: Record<string, string>;
  body?: Record<string, unknown>;
  loomUser?: LoomAuthUser | null;
};

type SiteRes = {
  statusCode?: number;
  setHeader?: (name: string, value: string) => void;
  appendHeader?: (name: string, value: string) => void;
  header?: (name: string, value: string) => unknown;
  type?: (contentType: string) => SiteRes;
  redirect?: ((status: number, url: string) => unknown) | ((url: string, status?: number) => unknown);
  status?: (code: number) => { send?: (body?: unknown) => unknown; type?: (t: string) => unknown };
  send?: (body?: unknown) => unknown;
};

/**
 * App-owned public/product UI. Auth HTML lives on Loom at `{APP_BASE_PATH}/login`;
 * this module serves marketing + signed-in app shell pages under the same prefix.
 */
@Controller(nestControllerPath(appBaseFromEnv() || '/'))
export class SiteController {
  constructor(
    private readonly views: SiteViewService,
    private readonly auth: LoomAuthService,
    private readonly loom: LoomService,
  ) {}

  @Get('assets/admin.css')
  @Header('Content-Type', 'text/css; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  adminCss(): string {
    return readFileSync(loomAdminCssPath(), 'utf8');
  }

  @Get('assets/branding.css')
  @Header('Content-Type', 'text/css; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  brandingCss(): string {
    return buildBrandingCss(this.loom.branding);
  }

  @Get('assets/alpine.min.js')
  @Header('Content-Type', 'application/javascript; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=86400')
  alpineJs(): string {
    return readFileSync(loomAlpineJsPath(), 'utf8');
  }

  @Get('assets/loom-ui.js')
  @Header('Content-Type', 'application/javascript; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  loomUi(): string {
    return readFileSync(loomUiJsPath(), 'utf8');
  }

  @Get('assets/site.css')
  @Header('Content-Type', 'text/css; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  siteCss(): string {
    return readFileSync(siteCssPath(), 'utf8');
  }

  @Get()
  async home(@Req() req: SiteReq, @Res() res: SiteRes): Promise<void> {
    const user = this.auth.enabled
      ? await this.auth.resolveUserFromRequest(req)
      : null;
    req.loomUser = user;
    this.sendHtml(
      res,
      this.views.render('home', 'public', this.pageContext(req, res, user)),
    );
  }

  @Get('app')
  async dashboard(@Req() req: SiteReq, @Res() res: SiteRes): Promise<void> {
    const user = await this.requireSignedIn(req, res, {
      allowGuestWhenAuthDisabled: true,
    });
    if (user === undefined) return;
    this.sendHtml(
      res,
      this.views.render('dashboard', 'app-shell', {
        ...this.pageContext(req, res, user),
        pageTitle: 'Portal',
        navActive: 'portal',
      }),
    );
  }

  @Get('app/profile')
  async profile(
    @Req() req: SiteReq,
    @Res() res: SiteRes,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ): Promise<void> {
    const user = await this.requireSignedIn(req, res);
    if (!user) return;
    this.sendHtml(
      res,
      this.views.render('profile', 'app-shell', {
        ...this.pageContext(req, res, user),
        pageTitle: 'Profile',
        navActive: 'profile',
        flash: flashFromQuery(success, error),
      }),
    );
  }

  @Get('app/profile/edit')
  async profileEditForm(
    @Req() req: SiteReq,
    @Res() res: SiteRes,
    @Query('success') success?: string,
    @Query('error') error?: string,
  ): Promise<void> {
    const user = await this.requireSignedIn(req, res);
    if (!user) return;
    this.sendHtml(
      res,
      this.views.render('profile-edit', 'app-shell', {
        ...this.pageContext(req, res, user),
        pageTitle: 'Edit profile',
        navActive: 'profile',
        flash: flashFromQuery(success, error),
      }),
    );
  }

  @Post('app/profile/edit')
  async profileEdit(
    @Req() req: SiteReq,
    @Res() res: SiteRes,
    @Body() body: { name?: string; email?: string },
  ): Promise<void> {
    const user = await this.requireSignedIn(req, res);
    if (!user) return;
    if (!this.assertMutationCsrf(req, res)) return;

    const result = await this.auth.updateProfile(user.id, {
      name: body.name,
      email: body.email,
    });
    if (!result.ok) {
      redirect(
        res,
        `${this.profileEditPath}?error=${encodeURIComponent(result.message)}`,
      );
      return;
    }
    req.loomUser = result.user;
    redirect(
      res,
      `${this.profilePath}?success=${encodeURIComponent('Profile updated')}`,
    );
  }

  @Get('app/profile/password')
  async profilePasswordForm(
    @Req() req: SiteReq,
    @Res() res: SiteRes,
    @Query('error') error?: string,
  ): Promise<void> {
    const user = await this.requireSignedIn(req, res);
    if (!user) return;
    this.sendHtml(
      res,
      this.views.render('profile-password', 'app-shell', {
        ...this.pageContext(req, res, user),
        pageTitle: 'Change password',
        navActive: 'profile',
        flash: flashFromQuery(undefined, error),
      }),
    );
  }

  @Post('app/profile/password')
  async profilePassword(
    @Req() req: SiteReq,
    @Res() res: SiteRes,
    @Body() body: {
      currentPassword?: string;
      password?: string;
      passwordConfirm?: string;
    },
  ): Promise<void> {
    const user = await this.requireSignedIn(req, res);
    if (!user) return;
    if (!this.assertMutationCsrf(req, res)) return;

    const password = String(body.password ?? '');
    const confirm = String(body.passwordConfirm ?? '');
    if (password !== confirm) {
      redirect(
        res,
        `${this.profilePasswordPath}?error=${encodeURIComponent('Passwords do not match')}`,
      );
      return;
    }

    const result = await this.auth.changePassword(
      user.id,
      String(body.currentPassword ?? ''),
      password,
    );
    if (!result.ok) {
      redirect(
        res,
        `${this.profilePasswordPath}?error=${encodeURIComponent(result.message)}`,
      );
      return;
    }

    setResponseCookies(res, this.auth.clearSessionCookies());
    redirect(
      res,
      `${this.auth.loginPath}?success=${encodeURIComponent('Password updated. Sign in again.')}`,
    );
  }

  private get profilePath(): string {
    return joinAppPath(this.loom.appBasePath, 'app/profile');
  }

  private get profileEditPath(): string {
    return joinAppPath(this.loom.appBasePath, 'app/profile/edit');
  }

  private get profilePasswordPath(): string {
    return joinAppPath(this.loom.appBasePath, 'app/profile/password');
  }

  /**
   * Returns the signed-in user, or `undefined` after redirecting to login.
   * When auth is disabled, returns `null` (guest mode).
   */
  private async requireSignedIn(
    req: SiteReq,
    res: SiteRes,
    options?: { allowGuestWhenAuthDisabled?: boolean },
  ): Promise<LoomAuthUser | null | undefined> {
    if (!this.auth.enabled) {
      if (options?.allowGuestWhenAuthDisabled) {
        req.loomUser = null;
        return null;
      }
      redirect(res, joinAppPath(this.loom.appBasePath, 'app'));
      return undefined;
    }
    const user = await this.auth.resolveUserFromRequest(req);
    if (!user) {
      const fallback = joinAppPath(this.loom.appBasePath, 'app');
      const path = (req.originalUrl ?? req.url ?? fallback).split('?')[0] || fallback;
      redirect(res, `${this.auth.loginPath}?redirect=${encodeURIComponent(path)}`);
      return undefined;
    }
    req.loomUser = user;
    return user;
  }

  private assertMutationCsrf(req: SiteReq, res: SiteRes): boolean {
    try {
      this.auth.assertCsrf(req);
      return true;
    } catch (error) {
      if (error instanceof LoomCsrfError) {
        redirect(
          res,
          `${this.auth.loginPath}?error=${encodeURIComponent(error.message)}`,
        );
        return false;
      }
      throw error;
    }
  }

  private pageContext(
    req: SiteReq,
    res: SiteRes,
    user?: LoomAuthUser | null,
  ): Record<string, unknown> {
    const csrf = this.auth.ensureCsrf(req, true);
    if (csrf.setCookie) {
      setResponseCookies(res, [csrf.setCookie]);
    }
    return {
      brandName: this.loom.branding.brandName,
      branding: this.loom.branding,
      csrfToken: csrf.token,
      user: user ?? null,
      homePath: this.loom.homePath,
      appPath: joinAppPath(this.loom.appBasePath, 'app'),
      profilePath: this.profilePath,
      profileEditPath: this.profileEditPath,
      profilePasswordPath: this.profilePasswordPath,
      assetsPath: joinAppPath(this.loom.appBasePath, 'assets'),
      adminPath: this.loom.basePath,
      loginPath: this.auth.loginPath,
      logoutPath: this.auth.logoutPath,
      authEnabled: this.auth.enabled,
    };
  }

  private sendHtml(res: SiteRes, html: string): void {
    if (typeof res.type === 'function') {
      res.type('text/html; charset=utf-8');
    } else {
      res.setHeader?.('Content-Type', 'text/html; charset=utf-8');
      res.header?.('Content-Type', 'text/html; charset=utf-8');
    }
    res.send?.(html);
  }
}

function flashFromQuery(
  success?: string,
  error?: string,
): { type: 'success' | 'error'; message: string } | undefined {
  if (error) return { type: 'error', message: error };
  if (success) return { type: 'success', message: success };
  return undefined;
}

function redirect(res: SiteRes, url: string): void {
  if (typeof res.redirect === 'function') {
    try {
      (res.redirect as (status: number, url: string) => unknown)(302, url);
      return;
    } catch {
      /* continue */
    }
    try {
      (res.redirect as (url: string, status?: number) => unknown)(url, 302);
      return;
    } catch {
      /* continue */
    }
  }
  if (typeof res.setHeader === 'function') {
    res.statusCode = 302;
    res.setHeader('Location', url);
    res.send?.('');
  }
}
