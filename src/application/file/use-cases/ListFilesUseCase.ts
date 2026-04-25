import { IFileRepository, FileFilters, PaginatedFiles } from '@domain/file/repositories/IFileRepository';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';

export interface ListFilesInput {
  requesterId: string;
  requesterRole: string;
  targetOwnerId?: string;
  page?: number;
  limit?: number;
  status?: string;
  mimeType?: string;
  tags?: string[];
  search?: string;
}

export class ListFilesUseCase {
  private readonly log = createChildLogger('ListFilesUseCase');

  constructor(private readonly fileRepository: IFileRepository) {}

  async execute(input: ListFilesInput): Promise<PaginatedFiles> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));

    const filters: FileFilters = {
      status: input.status ?? 'active',
      mimeType: input.mimeType,
      tags: input.tags,
      search: input.search,
      page,
      limit,
    };

    const isAdmin = input.requesterRole === 'admin';

    if (input.targetOwnerId) {
      // Admins can list any user's files; users can only list their own
      if (!isAdmin && input.targetOwnerId !== input.requesterId) {
        throw AppError.forbidden('You can only list your own files');
      }
      filters.ownerId = input.targetOwnerId;
    } else {
      // Default: list requester's own files (unless admin listing all)
      if (!isAdmin) {
        filters.ownerId = input.requesterId;
      }
    }

    const result = isAdmin && !filters.ownerId
      ? await this.fileRepository.findAll(filters)
      : await this.fileRepository.findByOwner(new UniqueEntityId(filters.ownerId!), filters);

    this.log.debug({ requesterId: input.requesterId, total: result.total }, 'Files listed');
    return result;
  }
}
