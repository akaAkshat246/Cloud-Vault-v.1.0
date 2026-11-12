import { app } from './app.js';
import { env } from './config/env.js';
import { AppDataSource } from './database/data-source.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    logger.info('Initializing CloudVault Backend...');

    // 1. Initialize PostgreSQL DataSource
    try {
      await AppDataSource.initialize();
      logger.info('Connected to PostgreSQL Database.');
    } catch (dbError) {
      logger.warn(
        { error: dbError },
        'PostgreSQL connection could not be established immediately. Server will start in degraded mode.'
      );
    }

    // 2. Start HTTP Server
    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(
        `CloudVault Backend running at http://${env.HOST}:${env.PORT} in ${env.NODE_ENV} mode`
      );
    });

    // 3. Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Graceful shutdown signal received. Closing HTTP server...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info('Database connection closed.');
        }
        process.exit(0);
      });

      // Force exit after 10s timeout
      setTimeout(() => {
        logger.error('Forcefully terminating process after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err }, 'Failed to bootstrap backend service');
    process.exit(1);
  }
}

bootstrap();

