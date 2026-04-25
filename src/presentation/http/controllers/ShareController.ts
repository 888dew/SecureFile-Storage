import { Request, Response, NextFunction } from 'express';
import { GenerateShareUrlUseCase } from '@application/share/use-cases/GenerateShareUrlUseCase';
import { AccessSharedFileUseCase } from '@application/share/use-cases/AccessSharedFileUseCase';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class ShareController {
  constructor(
    private readonly generateShareUrlUseCase: GenerateShareUrlUseCase,
    private readonly accessSharedFileUseCase: AccessSharedFileUseCase,
  ) {}

  generate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.generateShareUrlUseCase.execute({
        fileId: req.params.fileId,
        requesterId: req.user!.id,
        requesterRole: req.user!.role,
        expiresInHours: req.body.expiresInHours,
        maxDownloads: req.body.maxDownloads,
        allowedEmails: req.body.allowedEmails,
        permission: req.body.permission,
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  access = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.accessSharedFileUseCase.execute({
        token: req.params.token,
        requesterEmail: req.query.email as string | undefined,
      });

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.originalName)}"`);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.sizeBytes.toString());
      res.setHeader('X-Checksum-SHA256', result.checksum);
      res.setHeader('X-Share-Permission', result.permission);

      (result.stream as NodeJS.ReadableStream).pipe(res);
    } catch (err) {
      next(err);
    }
  };
}
