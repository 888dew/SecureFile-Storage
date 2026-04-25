import { IFileVersionRepository } from '@domain/file/repositories/IFileVersionRepository';
import { IFileRepository } from '@domain/file/repositories/IFileRepository';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { AppError } from '@shared/errors/AppError';

export interface GetFileVersionsInput {
  fileId: string;
  requesterId: string;
  requesterRole: string;
}

export interface FileVersionDto {
  id: string;
  versionNumber: number;
  sizeBytes: number;
  mimeType: string;
  checksum: string;
  uploadedBy: string;
  changeNote: string | null;
  createdAt: Date;
}

export class GetFileVersionsUseCase {
  constructor(
    private readonly fileVersionRepository: IFileVersionRepository,
    private readonly fileRepository: IFileRepository,
  ) {}

  async execute(input: GetFileVersionsInput): Promise<FileVersionDto[]> {
    const fileId = new UniqueEntityId(input.fileId);
    const file = await this.fileRepository.findById(fileId);

    if (!file || file.status === 'deleted') {
      throw AppError.notFound('File');
    }

    const requesterId = new UniqueEntityId(input.requesterId);
    const isAdmin = input.requesterRole === 'admin';

    if (!file.isOwnedBy(requesterId) && !isAdmin) {
      throw AppError.forbidden('You do not have access to this file');
    }

    const versions = await this.fileVersionRepository.findByFileId(fileId);

    return versions
      .sort((a, b) => b.versionNumber - a.versionNumber)
      .map((v) => ({
        id: v.id.value,
        versionNumber: v.versionNumber,
        sizeBytes: v.sizeBytes,
        mimeType: v.mimeType,
        checksum: v.checksum,
        uploadedBy: v.uploadedBy.value,
        changeNote: v.changeNote,
        createdAt: v.createdAt,
      }));
  }
}
