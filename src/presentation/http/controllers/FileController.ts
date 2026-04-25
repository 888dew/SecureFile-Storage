import { Response, NextFunction } from 'express';
import { UploadFileUseCase } from '@application/file/use-cases/UploadFileUseCase';
import { DownloadFileUseCase } from '@application/file/use-cases/DownloadFileUseCase';
import { ListFilesUseCase } from '@application/file/use-cases/ListFilesUseCase';
import { DeleteFileUseCase } from '@application/file/use-cases/DeleteFileUseCase';
import { GetFileVersionsUseCase } from '@application/file/use-cases/GetFileVersionsUseCase';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AppError } from '@shared/errors/AppError';

export class FileController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly downloadFileUseCase: DownloadFileUseCase,
    private readonly listFilesUseCase: ListFilesUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly getFileVersionsUseCase: GetFileVersionsUseCase,
  ) {}

  upload = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) throw AppError.validation('No file provided');

      const result = await this.uploadFileUseCase.execute({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        uploaderId: req.user!.id,
        tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined,
        changeNote: req.body.changeNote,
        existingFileId: req.body.existingFileId,
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  download = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.downloadFileUseCase.execute({
        fileId: req.params.id,
        requesterId: req.user!.id,
        requesterRole: req.user!.role,
      });

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.originalName)}"`);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.sizeBytes.toString());
      res.setHeader('X-Checksum-SHA256', result.checksum);

      (result.stream as NodeJS.ReadableStream).pipe(res);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listFilesUseCase.execute({
        requesterId: req.user!.id,
        requesterRole: req.user!.role,
        targetOwnerId: req.query.ownerId as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        status: req.query.status as string | undefined,
        mimeType: req.query.mimeType as string | undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        search: req.query.search as string | undefined,
      });

      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteFileUseCase.execute({
        fileId: req.params.id,
        requesterId: req.user!.id,
        requesterRole: req.user!.role,
        permanent: req.query.permanent === 'true',
      });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  getVersions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getFileVersionsUseCase.execute({
        fileId: req.params.id,
        requesterId: req.user!.id,
        requesterRole: req.user!.role,
      });

      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };
}
