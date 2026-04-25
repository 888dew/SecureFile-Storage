import { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { AppError } from '@shared/errors/AppError';
import { env } from '@shared/config/env';

const storage = multer.memoryStorage();

const ALLOWED_TYPES = env.ALLOWED_MIME_TYPES.split(',').map((t) => t.trim());
const MAX_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        AppError.invalidFileType(ALLOWED_TYPES) as unknown as null,
        false,
      );
    }
    cb(null, true);
  },
});

export const uploadSingle = (fieldName: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(AppError.fileTooLarge(env.MAX_FILE_SIZE_MB));
        }
        return next(AppError.validation(err.message));
      }
      if (err) {
        return next(err);
      }
      next();
    });
  };
