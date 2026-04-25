import 'reflect-metadata';
import { AppDataSource } from '@infrastructure/database/typeorm/data-source';
import { bootstrap } from '@shared/container/index';
import { createApp } from '@presentation/http/app';
import { logger } from '@shared/logger/logger';
import { env } from '@shared/config/env';

async function main(): Promise<void> {
  // Initialize database
  logger.info('Connecting to database...');
  await AppDataSource.initialize();
  logger.info('Database connected');

  // Bootstrap DI container
  logger.info('Bootstrapping application container...');
  const container = await bootstrap();

  // Create Express app
  const app = createApp({
    authController: container.authController,
    fileController: container.fileController,
    shareController: container.shareController,
    tokenProvider: new (await import('@infrastructure/providers/token/JwtTokenProvider')).JwtTokenProvider(),
    cacheProvider: container.redisProvider,
  });

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, url: env.APP_URL },
      '🚀 SecureFile Storage server started',
    );
  });

  // Graceful shutdown
  async function gracefulShutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await AppDataSource.destroy();
        logger.info('Database connection closed');

        await container.redisProvider.disconnect();
        logger.info('Redis connection closed');

        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start application');
  process.exit(1);
});
