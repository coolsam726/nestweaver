// https://nuxt.com/docs/api/configuration/nuxt-config
const nestOrigin = (
  process.env.API_BASE_SERVER ?? 'http://127.0.0.1:4000/api'
).replace(/\/api\/?$/, '');
const webDevPort = Number(process.env.WEB_DEV_PORT ?? 3000);
const webDevHost = process.env.WEB_DEV_HOST ?? '127.0.0.1';
const exposeDevServer =
  webDevHost === '0.0.0.0' || webDevHost === 'true' || webDevHost === '::';
const isDev = process.env.NODE_ENV !== 'production';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  nitro: {
    preset: 'node-listener',
    ...(isDev && {
      devProxy: {
        '/api/': {
          target: `${nestOrigin}/api/`,
          changeOrigin: true,
          prependPath: true,
        },
      },
      routeRules: {
        '/api/**': {
          proxy: `${nestOrigin}/api/**`,
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
      process.env.API_BASE_SERVER ?? 'http://127.0.0.1:4000/api',
    public: {
      apiBase: '/api',
    },
  },
  devServer: {
    port: webDevPort,
    host: webDevHost,
    strictPort: true,
  },
});
