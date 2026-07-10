import { existsSync } from 'node:fs';
import type { Socket } from 'node:net';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { NextFunction, Request, Response, RequestHandler } from 'express';
import { AppModule } from './app.module';
import { setSsrListener } from './ssr-fallback.controller';

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
    'SSR build output not found. Run "pnpm build" from the monorepo root first.',
  );
}

async function mountSsrProduction(app: NestExpressApplication): Promise<void> {
  const outputRoot = resolveWebOutputRoot();
  const listenerPath = join(outputRoot, 'server/index.mjs');
  const publicPath = join(outputRoot, 'public');

  const { listener } = (await import(
    pathToFileURL(listenerPath).href
  )) as { listener: RequestHandler };

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(express.static(publicPath));
  setSsrListener(listener);
}

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const enableWebProxy = process.env.ENABLE_WEB_PROXY === 'true';

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(),
  );

  let devProxy:
    | (RequestHandler & {
        upgrade: (req: unknown, socket: Socket, head: Buffer) => void;
      })
    | undefined;

  if (!isProduction && enableWebProxy) {
    devProxy = createProxyMiddleware({
      target: process.env.WEB_DEV_URL ?? 'http://127.0.0.1:3001',
      changeOrigin: true,
      ws: true,
    }) as typeof devProxy;

    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use((req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl ?? req.url ?? '';
      if (url.startsWith('/api')) {
        return next();
      }

      devProxy!(req, res, next);
    });
  }

  await app.init();

  if (isProduction) {
    await mountSsrProduction(app);
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

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
