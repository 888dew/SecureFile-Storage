export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'VIRUS_DETECTED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'SHARE_EXPIRED'
  | 'STORAGE_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational = true,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource: string): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, 'CONFLICT');
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError(message, 422, 'VALIDATION_ERROR', true, details);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', false);
  }

  static rateLimitExceeded(message = 'Too many requests'): AppError {
    return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }

  static fileTooLarge(maxSizeMb: number): AppError {
    return new AppError(`File exceeds maximum size of ${maxSizeMb}MB`, 413, 'FILE_TOO_LARGE');
  }

  static invalidFileType(allowed: string[]): AppError {
    return new AppError(
      `Invalid file type. Allowed: ${allowed.join(', ')}`,
      415,
      'INVALID_FILE_TYPE',
    );
  }

  static virusDetected(): AppError {
    return new AppError('File contains malicious content and was rejected', 422, 'VIRUS_DETECTED');
  }

  static shareExpired(): AppError {
    return new AppError('This share link has expired or is invalid', 410, 'SHARE_EXPIRED');
  }

  static storageError(message: string): AppError {
    return new AppError(message, 500, 'STORAGE_ERROR', false);
  }
}
