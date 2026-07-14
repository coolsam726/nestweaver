import type { Frontend, ScaffoldOptions } from './types.js';

export const FRONTEND_LABELS: Record<Frontend, string> = {
  nuxt: 'Nuxt 4',
  angular: 'Angular 22',
  'vite-react': 'Vite + React',
  'vite-vue': 'Vite + Vue',
  'vite-svelte': 'Vite + Svelte',
  'nest-hbs': 'Nest + Handlebars + Alpine (full stack)',
};

export function isNestHbsFrontend(options: ScaffoldOptions): boolean {
  return options.frontend === 'nest-hbs';
}

/** Separate `apps/web` SPA/SSR app (not Nest-rendered public UI). */
export function hasWebApp(options: ScaffoldOptions): boolean {
  return !isNestHbsFrontend(options);
}

export function isSsrFrontend(options: ScaffoldOptions): boolean {
  if (isNestHbsFrontend(options)) return false;
  return (
    options.renderMode === 'ssr' &&
    (options.frontend === 'nuxt' || options.frontend === 'angular')
  );
}

/** @deprecated Use isSsrFrontend */
export function isNuxtSsr(options: ScaffoldOptions): boolean {
  return isSsrFrontend(options);
}

export function isSpaFrontend(options: ScaffoldOptions): boolean {
  if (isNestHbsFrontend(options)) return false;
  return !isSsrFrontend(options);
}

export function isViteFrontend(options: ScaffoldOptions): boolean {
  return options.frontend.startsWith('vite-');
}

export function supportsRenderMode(frontend: Frontend): boolean {
  return frontend === 'nuxt' || frontend === 'angular';
}
