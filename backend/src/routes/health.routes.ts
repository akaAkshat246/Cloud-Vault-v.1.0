import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database/data-source.js';
import { storageService } from '../services/storage.service.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

healthRouter.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {
    database: 'down',
    storage: 'down'
  };

  let allHealthy = true;

  // 1. Database check
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.query('SELECT 1');
      checks.database = 'ok';
    } else {
      allHealthy = false;
    }
  } catch {
    allHealthy = false;
  }

  // 2. Storage check
  try {
    const storageOk = await storageService.checkHealth();
    if (storageOk) {
      checks.storage = 'ok';
    } else {
      allHealthy = false;
    }
  } catch {
    allHealthy = false;
  }

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: allHealthy ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  });
});

