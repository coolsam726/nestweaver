import { existsSync } from 'node:fs';
import type { Socket } from 'node:net';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import middie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { NextFunction, Request, Response, RequestHandler } from 'express';
import { AppModule } from './app.module';
import { setSsrListener } from './ssr-fallback.controller';

function isWebProxyEnabled(): boolean {
  return process.env.ENABLE_WEB_PROXY === 'true';
}

function webDevTarget(): string {
  return (
    process.env.WEB_DEV_URL ??
    'http://127.0.0.1:3000'
  );
}

async function ensureMiddie(fastify: FastifyInstance): Promise<void> {
  if (!fastify.hasDecorator('use')) {
    await fastify.register(middie);
  }
}

function resolveWebOutputRoot(): string {
  const candidates = [
    join(__dirname, '../../web/.output'),
    join(process.cwd(), 'apps/web/.output'),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'server/index.mjs'))) {
      return candidate;
    }
  }

  throw new Error(
    'Nuxt SSR build output not found. Run "pnpm build" from the monorepo root first.',
  );
}

async function mountSsrProduction(app: NestFastifyApplication): Promise<void> {
  const outputRoot = resolveWebOutputRoot();
  const listenerPath = join(outputRoot, 'server/index.mjs');
  const publicPath = join(outputRoot, 'public');

  const { listener } = (await import(
    pathToFileURL(listenerPath).href
  )) as { listener: RequestHandler };

  const fastify = app.getHttpAdapter().getInstance();
  await ensureMiddie(fastify);
  await fastify.register(fastifyStatic, {
    root: publicPath,
    wildcard: false,
  });
  setSsrListener(listener);
}

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const enableWebProxy = isWebProxyEnabled();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(),
    new FastifyAdapter(),
  );
  app.enableShutdownHooks();

  const fastify = app.getHttpAdapter().getInstance();

  let devProxy:
    | (RequestHandler & {
        upgrade: (req: unknown, socket: Socket, head: Buffer) => void;
      })
    | undefined;

  if (!isProduction && enableWebProxy) {
    devProxy = createProxyMiddleware({
      target: webDevTarget(),
      changeOrigin: true,
      ws: true,
    }) as typeof devProxy;

    await ensureMiddie(fastify);
    fastify.use((req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl ?? req.url ?? '';
      if (url.startsWith('/api') || url.startsWith('/admin')) {
        return next();
      }

      devProxy!(req, res, next);
    });
  }

  await app.init();

  if (isProduction) {
    await mountSsrProduction(app);
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');

  if (devProxy) {
    const server = app.getHttpServer();
    server.on('upgrade', (req, socket, head) => {
      if (req.url?.startsWith('/api')) {
        socket.destroy();
        return;
      }

      devProxy.upgrade(req, socket as Socket, head);
    });
  }

  logStartup(isProduction, enableWebProxy, port);
}

function logStartup(
  isProduction: boolean,
  enableWebProxy: boolean,
  port: number,
): void {
  if (isProduction) {
    console.log(`Production server listening on http://localhost:${port}`);
  } else if (enableWebProxy) {
    console.log(
      `Dev server listening on http://localhost:${port} (proxying frontend dev server)`,
    );
  } else {
    console.log(`API server listening on http://localhost:${port}`);
  }
}

void bootstrap();
