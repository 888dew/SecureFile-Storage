import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { IStorageProvider, StorageUploadResult, StorageDownloadResult } from '@application/ports/IStorageProvider';
import { AppError } from '@shared/errors/AppError';
import { env } from '@shared/config/env';
import { createChildLogger } from '@shared/logger/logger';

const log = createChildLogger('LocalStorageProvider');

export class LocalStorageProvider implements IStorageProvider {
  private readonly basePath: string;

  constructor() {
    this.basePath = path.resolve(env.LOCAL_STORAGE_PATH);
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async upload(params: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    ownerId: string;
    fileId: string;
  }): Promise<StorageUploadResult> {
    const ext = path.extname(params.originalName);
    const storedName = `${crypto.randomUUID()}${ext}`;
    const ownerDir = path.join(this.basePath, params.ownerId);

    if (!fs.existsSync(ownerDir)) {
      fs.mkdirSync(ownerDir, { recursive: true });
    }

    const storagePath = path.join(params.ownerId, storedName);
    const absolutePath = path.join(this.basePath, storagePath);

    await fs.promises.writeFile(absolutePath, params.buffer);

    const checksum = crypto.createHash('sha256').update(params.buffer).digest('hex');

    log.debug({ storagePath, sizeBytes: params.buffer.length }, 'File stored locally');

    return {
      storedName,
      storagePath,
      sizeBytes: params.buffer.length,
      checksum,
    };
  }

  async download(storagePath: string): Promise<StorageDownloadResult> {
    const absolutePath = path.join(this.basePath, storagePath);

    if (!fs.existsSync(absolutePath)) {
      throw AppError.notFound('File in storage');
    }

    const stat = await fs.promises.stat(absolutePath);
    const stream = fs.createReadStream(absolutePath);

    return {
      stream,
      contentType: 'application/octet-stream',
      sizeBytes: stat.size,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const absolutePath = path.join(this.basePath, storagePath);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
  }

  async generatePresignedUrl(storagePath: string, expiresInSeconds: number): Promise<string> {
    // For local storage, return a signed app URL
    const token = crypto.randomBytes(16).toString('hex');
    return `${env.APP_URL}/internal/files/${encodeURIComponent(storagePath)}?token=${token}&exp=${Date.now() + expiresInSeconds * 1000}`;
  }

  async exists(storagePath: string): Promise<boolean> {
    const absolutePath = path.join(this.basePath, storagePath);
    return fs.existsSync(absolutePath);
  }
}
