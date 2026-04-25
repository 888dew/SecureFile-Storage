import { DataSource, Repository } from 'typeorm';
import { IShareRepository } from '@domain/share/repositories/IShareRepository';
import { Share, SharePermission } from '@domain/share/entities/Share';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { ShareEntity } from '../entities/ShareEntity';

export class TypeOrmShareRepository implements IShareRepository {
  private readonly repo: Repository<ShareEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ShareEntity);
  }

  async findById(id: UniqueEntityId): Promise<Share | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByToken(token: string): Promise<Share | null> {
    const entity = await this.repo.findOne({ where: { token } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFileId(fileId: UniqueEntityId): Promise<Share[]> {
    const entities = await this.repo.find({
      where: { fileId: fileId.value },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(share: Share): Promise<void> {
    await this.repo.save(this.toPersistence(share));
  }

  async update(share: Share): Promise<void> {
    await this.repo.save(this.toPersistence(share));
  }

  async deleteByFileId(fileId: UniqueEntityId): Promise<void> {
    await this.repo.delete({ fileId: fileId.value });
  }

  private toDomain(entity: ShareEntity): Share {
    return Share.reconstitute(
      {
        fileId: new UniqueEntityId(entity.fileId),
        createdBy: new UniqueEntityId(entity.createdBy),
        token: entity.token,
        permission: entity.permission as SharePermission,
        expiresAt: entity.expiresAt,
        maxDownloads: entity.maxDownloads,
        downloadCount: entity.downloadCount,
        isRevoked: entity.isRevoked,
        allowedEmails: entity.allowedEmails,
        createdAt: entity.createdAt,
      },
      new UniqueEntityId(entity.id),
    );
  }

  private toPersistence(share: Share): ShareEntity {
    const entity = new ShareEntity();
    entity.id = share.id.value;
    entity.fileId = share.fileId.value;
    entity.createdBy = share.createdBy.value;
    entity.token = share.token;
    entity.permission = share.permission;
    entity.expiresAt = share.expiresAt;
    entity.maxDownloads = share.maxDownloads;
    entity.downloadCount = share.downloadCount;
    entity.isRevoked = share.isRevoked;
    entity.allowedEmails = share.allowedEmails;
    entity.createdAt = share.createdAt;
    return entity;
  }
}
