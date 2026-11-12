import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rootRouter } from './routes/index.js';
import { NotFoundError } from './utils/errors.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(helmet());

  // 2. CORS allowlist
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    })
  );

  // 3. JSON body parser & cookie parser
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // 4. Structured HTTP Request Logging
  app.use(requestLogger);

  // 5. Global Rate Limiter
  app.use(globalRateLimiter);

  // 6. Routes
  app.use(rootRouter);

  // 7. Catch-all for undefined routes
  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();

