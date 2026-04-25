import { IShareRepository } from '@domain/share/repositories/IShareRepository';
import { IFileRepository } from '@domain/file/repositories/IFileRepository';
import { IStorageProvider, StorageDownloadResult } from '@application/ports/IStorageProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';

export interface AccessSharedFileInput {
  token: string;
  requesterEmail?: string;
}

export interface AccessSharedFileOutput extends StorageDownloadResult {
  originalName: string;
  checksum: string;
  permission: string;
}

export class AccessSharedFileUseCase {
  private readonly log = createChildLogger('AccessSharedFileUseCase');

  constructor(
    private readonly shareRepository: IShareRepository,
    private readonly fileRepository: IFileRepository,
    private readonly storageProvider: IStorageProvider,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(input: AccessSharedFileInput): Promise<AccessSharedFileOutput> {
    // Try cache first
    const cacheKey = `share:${input.token}`;
    const cached = await this.cacheProvider.get<{ shareId: string; fileId: string }>(cacheKey);

    const share = await this.shareRepository.findByToken(input.token);
    if (!share) {
      throw AppError.shareExpired();
    }

    if (!share.isValid()) {
      throw AppError.shareExpired();
    }

    if (input.requesterEmail && !share.isEmailAllowed(input.requesterEmail)) {
      throw AppError.forbidden('Your email is not authorized to access this shared file');
    }

    const file = await this.fileRepository.findById(share.fileId);
    if (!file || file.status !== 'active') {
      throw AppError.notFound('File');
    }

    if (!file.isScanClear()) {
      throw AppError.forbidden('File is not available due to security concerns');
    }

    // Record access
    share.recordAccess();
    await this.shareRepository.update(share);

    const result = await this.storageProvider.download(file.storagePath);

    this.log.info({ token: input.token.slice(0, 8) + '...', fileId: file.id.value }, 'Shared file accessed');

    return {
      ...result,
      originalName: file.originalName,
      checksum: file.checksum,
      permission: share.permission,
    };
  }
}
