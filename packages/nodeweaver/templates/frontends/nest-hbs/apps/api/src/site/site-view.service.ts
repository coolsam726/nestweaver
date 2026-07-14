import { Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';

@Injectable()
export class SiteViewService implements OnModuleInit {
  private layouts = new Map<string, Handlebars.TemplateDelegate>();
  private pages = new Map<string, Handlebars.TemplateDelegate>();

  onModuleInit(): void {
    this.registerHelpers();
    const viewsDir = this.resolveViewsDir();
    this.loadPartials(join(viewsDir, 'partials'));
    this.loadTemplates(join(viewsDir, 'layouts'), this.layouts);
    this.loadTemplates(join(viewsDir, 'pages'), this.pages);
  }

  render(
    page: string,
    layout: 'public' | 'app-shell' | 'bare',
    data: Record<string, unknown>,
  ): string {
    const pageTpl = this.pages.get(page);
    if (!pageTpl) {
      throw new Error(`Site page template not found: ${page}`);
    }
    const body = pageTpl(data);
    if (layout === 'bare') {
      return body;
    }
    const layoutTpl = this.layouts.get(layout);
    if (!layoutTpl) {
      throw new Error(`Site layout template not found: ${layout}`);
    }
    return layoutTpl({ ...data, body });
  }

  private resolveViewsDir(): string {
    const candidates = [
      join(process.cwd(), 'views'),
      join(process.cwd(), 'apps/api/views'),
      join(__dirname, '..', '..', 'views'),
      join(__dirname, '..', 'views'),
    ];
    for (const dir of candidates) {
      if (existsSync(join(dir, 'pages'))) {
        return dir;
      }
    }
    throw new Error(
      `Site views directory not found (looked in: ${candidates.join(', ')})`,
    );
  }

  private loadPartials(dir: string): void {
    if (!existsSync(dir)) return;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.hbs')) continue;
      const name = file.replace(/\.hbs$/, '');
      const source = readFileSync(join(dir, file), 'utf8');
      Handlebars.registerPartial(name, source);
    }
  }

  private loadTemplates(
    dir: string,
    into: Map<string, Handlebars.TemplateDelegate>,
  ): void {
    if (!existsSync(dir)) return;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.hbs')) continue;
      const name = file.replace(/\.hbs$/, '');
      into.set(
        name,
        Handlebars.compile(readFileSync(join(dir, file), 'utf8'), {
          noEscape: true,
        }),
      );
    }
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    // Return first truthy value (coalesce). Boolean `.some()` breaks Loom templates
    // that use `{{or ../columns 2}}` — Handlebars helpers are process-global.
    Handlebars.registerHelper('or', (...args: unknown[]) => {
      const values = args.slice(0, -1);
      for (const value of values) {
        if (value) return value;
      }
      return values[values.length - 1];
    });
  }
}
