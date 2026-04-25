import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';

export function authRoutes(
  controller: AuthController,
  tokenProvider: ITokenProvider,
  cacheProvider: ICacheProvider,
): Router {
  const router = Router();
  const auth = authMiddleware(tokenProvider, cacheProvider);

  /**
   * @route POST /api/v1/auth/register
   * @desc Register a new user account
   * @access Public
   */
  router.post('/register', authRateLimiter, controller.register);

  /**
   * @route POST /api/v1/auth/login
   * @desc Authenticate user and return JWT tokens
   * @access Public
   */
  router.post('/login', authRateLimiter, controller.login);

  /**
   * @route POST /api/v1/auth/refresh
   * @desc Rotate refresh token and issue new access token
   * @access Public
   */
  router.post('/refresh', authRateLimiter, controller.refresh);

  /**
   * @route POST /api/v1/auth/logout
   * @desc Revoke tokens (blacklist)
   * @access Private
   */
  router.post('/logout', auth, controller.logout);

  /**
   * @route GET /api/v1/auth/me
   * @desc Get current authenticated user
   * @access Private
   */
  router.get('/me', auth, controller.me);

  return router;
}
