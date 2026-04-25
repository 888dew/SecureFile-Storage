import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/errors/AppError';
import { logger } from '@shared/logger/logger';
import { ZodError } from 'zod';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, url: req.url, method: req.method }, 'Unexpected application error');
    }

    res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Unexpected / non-operational error
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}
