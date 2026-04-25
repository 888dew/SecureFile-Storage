import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import {
  IFileRepository,
  FileFilters,
  PaginatedFiles,
} from '@domain/file/repositories/IFileRepository';
import { File, FileStatus, ScanStatus } from '@domain/file/entities/File';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { FileEntity } from '../entities/FileEntity';

export class TypeOrmFileRepository implements IFileRepository {
  private readonly repo: Repository<FileEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(FileEntity);
  }

  async findById(id: UniqueEntityId): Promise<File | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByOwner(ownerId: UniqueEntityId, filters: FileFilters): Promise<PaginatedFiles> {
    const qb = this.buildQuery({ ...filters, ownerId: ownerId.value });
    return this.paginate(qb, filters.page ?? 1, filters.limit ?? 20);
  }

  async findAll(filters: FileFilters): Promise<PaginatedFiles> {
    const qb = this.buildQuery(filters);
    return this.paginate(qb, filters.page ?? 1, filters.limit ?? 20);
  }

  async save(file: File): Promise<void> {
    await this.repo.save(this.toPersistence(file));
  }

  async update(file: File): Promise<void> {
    await this.repo.save(this.toPersistence(file));
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await this.repo.delete({ id: id.value });
  }

  async existsByChecksumAndOwner(
    checksum: string,
    ownerId: UniqueEntityId,
  ): Promise<File | null> {
    const entity = await this.repo.findOne({
      where: { checksum, ownerId: ownerId.value, status: 'active' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async countByOwner(ownerId: UniqueEntityId): Promise<number> {
    return this.repo.count({ where: { ownerId: ownerId.value, status: 'active' } });
  }

  private buildQuery(filters: FileFilters): SelectQueryBuilder<FileEntity> {
    const qb = this.repo.createQueryBuilder('file');

    if (filters.ownerId) {
      qb.andWhere('file.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    qb.andWhere('file.status = :status', { status: filters.status ?? 'active' });

    if (filters.mimeType) {
      qb.andWhere('file.mimeType LIKE :mimeType', { mimeType: `${filters.mimeType}%` });
    }

    if (filters.tags && filters.tags.length > 0) {
      qb.andWhere('file.tags && :tags', { tags: filters.tags });
    }

    if (filters.search) {
      qb.andWhere('file.originalName ILIKE :search', { search: `%${filters.search}%` });
    }

    return qb.orderBy('file.createdAt', 'DESC');
  }

  private async paginate(
    qb: SelectQueryBuilder<FileEntity>,
    page: number,
    limit: number,
  ): Promise<PaginatedFiles> {
    const [entities, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: entities.map((e) => this.toDomain(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private toDomain(entity: FileEntity): File {
    return File.reconstitute(
      {
        ownerId: new UniqueEntityId(entity.ownerId),
        originalName: entity.originalName,
        storedName: entity.storedName,
        mimeType: entity.mimeType,
        sizeBytes: parseInt(entity.sizeBytes, 10),
        storagePath: entity.storagePath,
        checksum: entity.checksum,
        status: entity.status as FileStatus,
        scanStatus: entity.scanStatus as ScanStatus,
        scanResult: entity.scanResult,
        currentVersionId: entity.currentVersionId
          ? new UniqueEntityId(entity.currentVersionId)
          : null,
        versionCount: entity.versionCount,
        isPublic: entity.isPublic,
        tags: entity.tags,
        metadata: entity.metadata,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt,
      },
      new UniqueEntityId(entity.id),
    );
  }

  private toPersistence(file: File): FileEntity {
    const entity = new FileEntity();
    entity.id = file.id.value;
    entity.ownerId = file.ownerId.value;
    entity.originalName = file.originalName;
    entity.storedName = file.storedName;
    entity.mimeType = file.mimeType;
    entity.sizeBytes = file.sizeBytes.toString();
    entity.storagePath = file.storagePath;
    entity.checksum = file.checksum;
    entity.status = file.status;
    entity.scanStatus = file.scanStatus;
    entity.scanResult = file.scanResult;
    entity.currentVersionId = file.currentVersionId?.value ?? null;
    entity.versionCount = file.versionCount;
    entity.isPublic = file.isPublic;
    entity.tags = file.tags;
    entity.metadata = file.metadata;
    entity.createdAt = file.createdAt;
    entity.updatedAt = file.updatedAt;
    entity.deletedAt = file.deletedAt;
    return entity;
  }
}
