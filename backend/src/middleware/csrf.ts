import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function enforceCsrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // If refresh token is coming via body (e.g. Native Android App), CSRF does not apply
  if (req.body?.refreshToken && !req.cookies?.cv_refresh_token) {
    return next();
  }

  // If using cookies (Web Client), enforce Origin/Referer check and custom header
  const origin = req.headers.origin || req.headers.referer;
  const customHeader = req.headers['x-requested-with'] || req.headers['x-cloudvault-client'];

  if (!customHeader && (!origin || !origin.startsWith(env.CORS_ORIGIN))) {
    return next(new ForbiddenError('CSRF protection violation: origin not allowed or custom header missing'));
  }

  next();
}

