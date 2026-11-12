import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { NotImplementedError } from '../utils/errors.js';

export const rootRouter = Router();

// Liveness & Readiness at root level
rootRouter.use(healthRouter);

// API v1 Router
export const apiV1Router = Router();

// Milestone M3: Authentication, Sessions, and Recovery Kit routes
apiV1Router.use('/auth', authRouter);

// Future M4: File & Folder routes stub
apiV1Router.use('/files', (_req, _res, next) => {
  next(new NotImplementedError('File and upload endpoints are scheduled for Milestone M4.'));
});

apiV1Router.use('/folders', (_req, _res, next) => {
  next(new NotImplementedError('Folder management endpoints are scheduled for Milestone M4.'));
});

// Future M7: Share routes stub
apiV1Router.use('/shares', (_req, _res, next) => {
  next(new NotImplementedError('Share link endpoints are scheduled for Milestone M7.'));
});

// Mount v1 router under /api/v1
rootRouter.use('/api/v1', apiV1Router);

