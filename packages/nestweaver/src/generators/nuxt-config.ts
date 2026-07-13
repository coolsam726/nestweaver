import type { ScaffoldOptions } from '../types.js';
import {
  WEB_DEV_DEFAULT_PORT,
  nestApiBaseUrl,
} from '../constants.js';

export function generateNuxtConfig(options: ScaffoldOptions): string {
  const ssr = options.renderMode === 'ssr';
  const apiBase = nestApiBaseUrl();

  return `// https://nuxt.com/docs/api/configuration/nuxt-config
const nestOrigin = (
  process.env.API_BASE_SERVER ?? '${apiBase}'
).replace(/\\/api\\/?$/, '');
const webDevPort = Number(process.env.WEB_DEV_PORT ?? ${WEB_DEV_DEFAULT_PORT});
const webDevHost = process.env.WEB_DEV_HOST ?? '127.0.0.1';
const exposeDevServer =
  webDevHost === '0.0.0.0' || webDevHost === 'true' || webDevHost === '::';
const isDev = process.env.NODE_ENV !== 'production';
const appBaseRaw = (process.env.APP_BASE_PATH || '').trim();
const appBase =
  !appBaseRaw || appBaseRaw === '/'
    ? ''
    : (appBaseRaw.startsWith('/') ? appBaseRaw : \`/\${appBaseRaw}\`).replace(/\\/+$/, '');
const appBaseURL = appBase ? \`\${appBase}/\` : '/';
const apiMount = appBase ? \`\${appBase}/api\` : '/api';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: ${ssr},
  app: {
    baseURL: appBaseURL,
  },
  nitro: {
    preset: 'node-listener',
    ...(isDev && {
      devProxy: {
        [\`\${apiMount}/\`]: {
          target: \`\${nestOrigin}\${apiMount}/\`,
          changeOrigin: true,
          prependPath: true,
        },
      },
      routeRules: {
        [\`\${apiMount}/**\`]: {
          proxy: \`\${nestOrigin}\${apiMount}/**\`,
        },
      },
    }),
  },
  vite: {
    server: {
      hmr: exposeDevServer
        ? {
            protocol: 'ws',
            clientPort: webDevPort,
          }
        : {
            protocol: 'ws',
            host: '127.0.0.1',
            port: webDevPort,
            clientPort: webDevPort,
          },
    },
  },
  runtimeConfig: {
    apiBaseServer:
      process.env.API_BASE_SERVER ?? '${apiBase}',
    public: {
      apiBase: apiMount,
    },
  },
  devServer: {
    port: webDevPort,
    host: webDevHost,
    strictPort: true,
  },
});
`;
}
