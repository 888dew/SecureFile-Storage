import { DataSource, Repository } from 'typeorm';
import { IFileVersionRepository } from '@domain/file/repositories/IFileVersionRepository';
import { FileVersion } from '@domain/file/entities/FileVersion';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { FileVersionEntity } from '../entities/FileVersionEntity';

export class TypeOrmFileVersionRepository implements IFileVersionRepository {
  private readonly repo: Repository<FileVersionEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(FileVersionEntity);
  }

  async findById(id: UniqueEntityId): Promise<FileVersion | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFileId(fileId: UniqueEntityId): Promise<FileVersion[]> {
    const entities = await this.repo.find({
      where: { fileId: fileId.value },
      order: { versionNumber: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findLatestByFileId(fileId: UniqueEntityId): Promise<FileVersion | null> {
    const entity = await this.repo.findOne({
      where: { fileId: fileId.value },
      order: { versionNumber: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(version: FileVersion): Promise<void> {
    await this.repo.save(this.toPersistence(version));
  }

  async countByFileId(fileId: UniqueEntityId): Promise<number> {
    return this.repo.count({ where: { fileId: fileId.value } });
  }

  async deleteByFileId(fileId: UniqueEntityId): Promise<void> {
    await this.repo.delete({ fileId: fileId.value });
  }

  private toDomain(entity: FileVersionEntity): FileVersion {
    return FileVersion.reconstitute(
      {
        fileId: new UniqueEntityId(entity.fileId),
        versionNumber: entity.versionNumber,
        storedName: entity.storedName,
        storagePath: entity.storagePath,
        sizeBytes: parseInt(entity.sizeBytes, 10),
        checksum: entity.checksum,
        mimeType: entity.mimeType,
        uploadedBy: new UniqueEntityId(entity.uploadedBy),
        changeNote: entity.changeNote,
        createdAt: entity.createdAt,
      },
      new UniqueEntityId(entity.id),
    );
  }

  private toPersistence(version: FileVersion): FileVersionEntity {
    const entity = new FileVersionEntity();
    entity.id = version.id.value;
    entity.fileId = version.fileId.value;
    entity.versionNumber = version.versionNumber;
    entity.storedName = version.storedName;
    entity.storagePath = version.storagePath;
    entity.sizeBytes = version.sizeBytes.toString();
    entity.checksum = version.checksum;
    entity.mimeType = version.mimeType;
    entity.uploadedBy = version.uploadedBy.value;
    entity.changeNote = version.changeNote;
    entity.createdAt = version.createdAt;
    return entity;
  }
}
