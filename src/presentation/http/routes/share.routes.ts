import { Router } from 'express';
import { ShareController } from '../controllers/ShareController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';

export function shareRoutes(
  controller: ShareController,
  tokenProvider: ITokenProvider,
  cacheProvider: ICacheProvider,
): Router {
  const router = Router();
  const auth = authMiddleware(tokenProvider, cacheProvider);

  /**
   * @route POST /api/v1/files/:fileId/shares
   * @desc Generate a temporary share URL for a file
   * @access Private
   */
  router.post('/files/:fileId/shares', auth, controller.generate);

  /**
   * @route GET /api/v1/shares/:token
   * @desc Access a shared file by token (public endpoint)
   * @access Public
   */
  router.get('/shares/:token', controller.access);

  return router;
}
