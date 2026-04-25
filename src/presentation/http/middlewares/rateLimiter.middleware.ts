import rateLimit from 'express-rate-limit';
import { RedisProvider } from '@infrastructure/providers/cache/RedisProvider';
import { AppError } from '@shared/errors/AppError';
import { env } from '@shared/config/env';
import { Request, Response } from 'express';

function createLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      const error = AppError.rateLimitExceeded(options.message);
      res.status(error.statusCode).json({
        status: 'error',
        code: error.code,
        message: error.message,
      });
    },
    skip: (req: Request) => req.ip === '127.0.0.1' && env.NODE_ENV === 'test',
  });
}

export const globalRateLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests. Please try again later.',
});

export const authRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: 'Too many authentication attempts. Please wait 15 minutes.',
});

export const uploadRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.UPLOAD_RATE_LIMIT_MAX,
  message: 'Upload limit reached. Please wait before uploading more files.',
});
