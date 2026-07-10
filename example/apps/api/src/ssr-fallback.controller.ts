import { All, Controller, Next, Req, Res } from '@nestjs/common';
import type { NextFunction, Request, Response, RequestHandler } from 'express';

type SsrListener = RequestHandler;

let ssrListener: SsrListener | null = null;

export function setSsrListener(listener: SsrListener): void {
  ssrListener = listener;
}

@Controller()
export class SsrFallbackController {
  @All('*')
  handle(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    const path = req.path ?? req.url ?? '';
    if (path.startsWith('/api') || path.startsWith('/admin') || !ssrListener) {
      return next();
    }

    void ssrListener(req, res, next);
  }
}
