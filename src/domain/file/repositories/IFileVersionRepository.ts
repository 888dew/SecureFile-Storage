import { FileVersion } from '@domain/file/entities/FileVersion';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';

export interface IFileVersionRepository {
  findById(id: UniqueEntityId): Promise<FileVersion | null>;
  findByFileId(fileId: UniqueEntityId): Promise<FileVersion[]>;
  findLatestByFileId(fileId: UniqueEntityId): Promise<FileVersion | null>;
  save(version: FileVersion): Promise<void>;
  countByFileId(fileId: UniqueEntityId): Promise<number>;
  deleteByFileId(fileId: UniqueEntityId): Promise<void>;
}
