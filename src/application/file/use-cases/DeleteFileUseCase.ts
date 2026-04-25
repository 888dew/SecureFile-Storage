import { IFileRepository } from '@domain/file/repositories/IFileRepository';
import { IFileVersionRepository } from '@domain/file/repositories/IFileVersionRepository';
import { IShareRepository } from '@domain/share/repositories/IShareRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IStorageProvider } from '@application/ports/IStorageProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';

export interface DeleteFileInput {
  fileId: string;
  requesterId: string;
  requesterRole: string;
  permanent?: boolean; // Admin-only hard delete
}

export class DeleteFileUseCase {
  private readonly log = createChildLogger('DeleteFileUseCase');

  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly fileVersionRepository: IFileVersionRepository,
    private readonly shareRepository: IShareRepository,
    private readonly userRepository: IUserRepository,
    private readonly storageProvider: IStorageProvider,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(input: DeleteFileInput): Promise<void> {
    const fileId = new UniqueEntityId(input.fileId);
    const file = await this.fileRepository.findById(fileId);

    if (!file || file.status === 'deleted') {
      throw AppError.notFound('File');
    }

    const requesterId = new UniqueEntityId(input.requesterId);
    const isAdmin = input.requesterRole === 'admin';

    if (!file.isOwnedBy(requesterId) && !isAdmin) {
      throw AppError.forbidden('You do not have permission to delete this file');
    }

    if (input.permanent && isAdmin) {
      // Hard delete: remove from storage and DB
      const versions = await this.fileVersionRepository.findByFileId(fileId);
      for (const version of versions) {
        await this.storageProvider.delete(version.storagePath).catch(() => {});
      }
      await this.shareRepository.deleteByFileId(fileId);
      await this.fileVersionRepository.deleteByFileId(fileId);
      await this.fileRepository.delete(fileId);
    } else {
      // Soft delete: mark as deleted, reclaim quota
      file.softDelete();
      await this.fileRepository.update(file);
    }

    // Reclaim storage quota
    const owner = await this.userRepository.findById(file.ownerId);
    if (owner) {
      owner.decrementStorage(file.sizeBytes);
      await this.userRepository.update(owner);
    }

    // Invalidate cache
    await this.cacheProvider.del(`files:${input.requesterId}`);
    await this.cacheProvider.del(`file:${input.fileId}`);

    this.log.info(
      { fileId: input.fileId, userId: input.requesterId, permanent: input.permanent },
      'File deleted',
    );
  }
}
