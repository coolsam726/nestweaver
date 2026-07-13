import { All, Controller, Next, Req, Res } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { isNestOwnedPath } from './app-path';

let spaIndexHtml: string | null = null;

export function setSpaIndexHtml(html: string): void {
  spaIndexHtml = html;
}

@Controller()
export class SpaFallbackController {
  @All('*')
  handle(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    const path = req.path ?? req.url ?? '';
    if (isNestOwnedPath(path)) {
      return next();
    }

    if (!spaIndexHtml) {
      return next();
    }

    res.type('html').send(spaIndexHtml);
  }
}
