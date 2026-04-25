import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { uploadRateLimiter } from '../middlewares/rateLimiter.middleware';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';

export function fileRoutes(
  controller: FileController,
  tokenProvider: ITokenProvider,
  cacheProvider: ICacheProvider,
): Router {
  const router = Router();
  const auth = authMiddleware(tokenProvider, cacheProvider);

  /**
   * @route POST /api/v1/files
   * @desc Upload a new file or a new version of an existing file
   * @access Private
   */
  router.post('/', auth, uploadRateLimiter, uploadSingle('file'), controller.upload);

  /**
   * @route GET /api/v1/files
   * @desc List files (own files by default; admins can list all)
   * @access Private
   */
  router.get('/', auth, controller.list);

  /**
   * @route GET /api/v1/files/:id/download
   * @desc Download a file by ID
   * @access Private
   */
  router.get('/:id/download', auth, controller.download);

  /**
   * @route GET /api/v1/files/:id/versions
   * @desc Get version history of a file
   * @access Private
   */
  router.get('/:id/versions', auth, controller.getVersions);

  /**
   * @route DELETE /api/v1/files/:id
   * @desc Soft-delete a file (permanent=true for hard delete, admin only)
   * @access Private
   */
  router.delete('/:id', auth, controller.delete);

  return router;
}
