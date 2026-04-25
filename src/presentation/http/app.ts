import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { logger } from '@shared/logger/logger';
import { env } from '@shared/config/env';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandlerMiddleware } from './middlewares/errorHandler.middleware';
import { authRoutes } from './routes/auth.routes';
import { fileRoutes } from './routes/file.routes';
import { shareRoutes } from './routes/share.routes';
import { AuthController } from './controllers/AuthController';
import { FileController } from './controllers/FileController';
import { ShareController } from './controllers/ShareController';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';

interface AppDependencies {
  authController: AuthController;
  fileController: FileController;
  shareController: ShareController;
  tokenProvider: ITokenProvider;
  cacheProvider: ICacheProvider;
}

export function createApp(deps: AppDependencies): express.Application {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Compression
  app.use(compression());

  // HTTP request logger
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res) => {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      redact: ['req.headers.authorization'],
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Global rate limiting
  app.use(globalRateLimiter);

  // Health checks (no rate limit, no auth)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/health/ready', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  });

  // API routes
  const apiRouter = express.Router();

  apiRouter.use('/auth', authRoutes(deps.authController, deps.tokenProvider, deps.cacheProvider));
  apiRouter.use('/files', fileRoutes(deps.fileController, deps.tokenProvider, deps.cacheProvider));

  // Share routes are mounted at the API level (different prefixes)
  const shareRouter = shareRoutes(deps.shareController, deps.tokenProvider, deps.cacheProvider);
  apiRouter.use('/', shareRouter);

  app.use('/api/v1', apiRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Route not found',
    });
  });

  // Error handler (must be last)
  app.use(errorHandlerMiddleware);

  return app;
}
