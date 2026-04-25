import { Share } from '@domain/share/entities/Share';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';

export interface IShareRepository {
  findById(id: UniqueEntityId): Promise<Share | null>;
  findByToken(token: string): Promise<Share | null>;
  findByFileId(fileId: UniqueEntityId): Promise<Share[]>;
  save(share: Share): Promise<void>;
  update(share: Share): Promise<void>;
  deleteByFileId(fileId: UniqueEntityId): Promise<void>;
}
