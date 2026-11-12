import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(
      {
        code: err.code,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        details: err.details
      },
      err.message
    );

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      }
    });
    return;
  }

  // Unhandled / Unexpected Errors
  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: env.NODE_ENV !== 'production' ? err.stack : undefined
      },
      path: req.path,
      method: req.method
    },
    'Unhandled server error occurred'
  );

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message
    }
  });
}

