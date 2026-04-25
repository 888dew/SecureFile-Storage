import { IShareRepository } from '@domain/share/repositories/IShareRepository';
import { IFileRepository } from '@domain/file/repositories/IFileRepository';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { Share } from '@domain/share/entities/Share';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';
import { env } from '@shared/config/env';
import crypto from 'crypto';

export interface GenerateShareUrlInput {
  fileId: string;
  requesterId: string;
  requesterRole: string;
  expiresInHours?: number;
  maxDownloads?: number;
  allowedEmails?: string[];
  permission?: 'view' | 'download';
}

export interface GenerateShareUrlOutput {
  shareId: string;
  token: string;
  url: string;
  expiresAt: Date;
  maxDownloads: number | null;
}

export class GenerateShareUrlUseCase {
  private readonly log = createChildLogger('GenerateShareUrlUseCase');

  constructor(
    private readonly shareRepository: IShareRepository,
    private readonly fileRepository: IFileRepository,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(input: GenerateShareUrlInput): Promise<GenerateShareUrlOutput> {
    const fileId = new UniqueEntityId(input.fileId);
    const file = await this.fileRepository.findById(fileId);

    if (!file || file.status === 'deleted') {
      throw AppError.notFound('File');
    }

    const requesterId = new UniqueEntityId(input.requesterId);
    const isAdmin = input.requesterRole === 'admin';

    if (!file.isOwnedBy(requesterId) && !isAdmin) {
      throw AppError.forbidden('You do not have permission to share this file');
    }

    if (!file.isScanClear()) {
      throw AppError.forbidden('File cannot be shared: it has not passed security scan');
    }

    const hours = input.expiresInHours ?? env.SHARE_TOKEN_EXPIRES_IN_HOURS;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const token = crypto.randomBytes(32).toString('hex');

    const share = Share.create({
      fileId,
      createdBy: requesterId,
      token,
      permission: input.permission ?? 'download',
      expiresAt,
      maxDownloads: input.maxDownloads ?? null,
      allowedEmails: input.allowedEmails?.map((e) => e.toLowerCase()) ?? [],
    });

    await this.shareRepository.save(share);

    // Cache the share for fast lookup
    const cacheKey = `share:${token}`;
    await this.cacheProvider.set(cacheKey, { shareId: share.id.value, fileId: input.fileId }, hours * 3600);

    this.log.info({ fileId: input.fileId, shareId: share.id.value }, 'Share URL generated');

    const url = `${env.APP_URL}/api/v1/shares/${token}`;

    return {
      shareId: share.id.value,
      token,
      url,
      expiresAt,
      maxDownloads: share.maxDownloads,
    };
  }
}
