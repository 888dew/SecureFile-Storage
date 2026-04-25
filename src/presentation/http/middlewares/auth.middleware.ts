import { Request, Response, NextFunction } from 'express';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { AppError } from '@shared/errors/AppError';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(
  tokenProvider: ITokenProvider,
  cacheProvider: ICacheProvider,
) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Missing or invalid Authorization header'));
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist (logout)
    const isBlacklisted = await cacheProvider.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(AppError.unauthorized('Token has been revoked'));
    }

    const payload = await tokenProvider.verifyAccessToken(token).catch((err) => next(err));
    if (!payload) return;

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient permissions'));
    }
    next();
  };
}
