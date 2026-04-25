import { IFileRepository } from '@domain/file/repositories/IFileRepository';
import { IStorageProvider, StorageDownloadResult } from '@application/ports/IStorageProvider';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';

export interface DownloadFileInput {
  fileId: string;
  requesterId: string;
  requesterRole: string;
}

export interface DownloadFileOutput extends StorageDownloadResult {
  originalName: string;
  checksum: string;
}

export class DownloadFileUseCase {
  private readonly log = createChildLogger('DownloadFileUseCase');

  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(input: DownloadFileInput): Promise<DownloadFileOutput> {
    const fileId = new UniqueEntityId(input.fileId);
    const file = await this.fileRepository.findById(fileId);

    if (!file || file.status === 'deleted') {
      throw AppError.notFound('File');
    }

    const requesterId = new UniqueEntityId(input.requesterId);
    const isOwner = file.isOwnedBy(requesterId);
    const isAdmin = input.requesterRole === 'admin';

    if (!isOwner && !isAdmin && !file.isPublic) {
      throw AppError.forbidden('You do not have access to this file');
    }

    if (file.status === 'quarantined') {
      throw AppError.forbidden('File is quarantined due to security concerns');
    }

    const result = await this.storageProvider.download(file.storagePath);

    this.log.info({ fileId: input.fileId, userId: input.requesterId }, 'File downloaded');

    return {
      ...result,
      originalName: file.originalName,
      checksum: file.checksum,
    };
  }
}
