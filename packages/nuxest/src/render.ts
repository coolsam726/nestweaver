import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import type { TemplateContext } from './types.js';

Handlebars.registerHelper('eq', (a, b) => a === b);

export function renderTemplate(
  source: string,
  context: TemplateContext,
): string {
  return Handlebars.compile(source, { noEscape: true })(context);
}

export function renderFile(
  filePath: string,
  context: TemplateContext,
): string {
  return renderTemplate(readFileSync(filePath, 'utf8'), context);
}

export function toContext(
  options: import('./types.js').ScaffoldOptions,
): TemplateContext {
  return {
    ...options,
    sharedScope: `@${options.projectName}/shared`,
    isSsr: options.nuxtMode === 'ssr',
    isSpa: options.nuxtMode === 'spa',
    isFastify: options.httpAdapter === 'fastify',
    isExpress: options.httpAdapter === 'express',
    hasDatabase: options.orm !== 'none',
    nuxtMode: options.nuxtMode,
    admin: options.admin,
    orm: options.orm,
  } as TemplateContext & {
    nuxtMode: string;
    admin: boolean;
    orm: string;
  };
}
