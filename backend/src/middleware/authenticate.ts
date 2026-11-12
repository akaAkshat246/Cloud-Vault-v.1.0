import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenUserPayload } from '../utils/token.js';
import { UnauthorizedError } from '../utils/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload: TokenUserPayload = await verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email as string
    };
    next();
  } catch (error) {
    next(error);
  }
}

