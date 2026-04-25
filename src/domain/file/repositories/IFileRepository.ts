import { File } from '@domain/file/entities/File';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';

export interface FileFilters {
  ownerId?: string;
  status?: string;
  mimeType?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedFiles {
  items: File[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IFileRepository {
  findById(id: UniqueEntityId): Promise<File | null>;
  findByOwner(ownerId: UniqueEntityId, filters: FileFilters): Promise<PaginatedFiles>;
  findAll(filters: FileFilters): Promise<PaginatedFiles>;
  save(file: File): Promise<void>;
  update(file: File): Promise<void>;
  delete(id: UniqueEntityId): Promise<void>;
  existsByChecksumAndOwner(checksum: string, ownerId: UniqueEntityId): Promise<File | null>;
  countByOwner(ownerId: UniqueEntityId): Promise<number>;
}
