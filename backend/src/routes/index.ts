import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { fileRouter } from './file.routes.js';
import { NotImplementedError } from '../utils/errors.js';

export const rootRouter = Router();

// Liveness & Readiness at root level
rootRouter.use(healthRouter);

// API v1 Router
export const apiV1Router = Router();

// Milestone M3: Authentication, Sessions, and Recovery Kit routes
apiV1Router.use('/auth', authRouter);

// Milestone M4: Direct-to-S3 Chunked Upload, Download & Metadata Routes
apiV1Router.use(fileRouter);

// Future M7: Share routes stub
apiV1Router.use('/shares', (_req, _res, next) => {
  next(new NotImplementedError('Share link endpoints are scheduled for Milestone M7.'));
});

// Mount v1 router under /api/v1
rootRouter.use('/api/v1', apiV1Router);

