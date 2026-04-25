import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';
import { IStorageProvider, StorageUploadResult, StorageDownloadResult } from '@application/ports/IStorageProvider';
import { AppError } from '@shared/errors/AppError';
import { env } from '@shared/config/env';
import { createChildLogger } from '@shared/logger/logger';

const log = createChildLogger('S3StorageProvider');

export class S3StorageProvider implements IStorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
      throw new Error('S3 configuration is incomplete. Check S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY');
    }

    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
    });
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
    const storagePath = `uploads/${params.ownerId}/${storedName}`;
    const checksum = crypto.createHash('sha256').update(params.buffer).digest('hex');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
        Body: params.buffer,
        ContentType: params.mimeType,
        ChecksumSHA256: checksum,
        Metadata: {
          'original-name': encodeURIComponent(params.originalName),
          'owner-id': params.ownerId,
          'file-id': params.fileId,
        },
      }),
    );

    log.debug({ storagePath, bucket: this.bucket }, 'File uploaded to S3');

    return {
      storedName,
      storagePath,
      sizeBytes: params.buffer.length,
      checksum,
    };
  }

  async download(storagePath: string): Promise<StorageDownloadResult> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: storagePath }),
      );

      if (!response.Body) {
        throw AppError.storageError('S3 returned empty body');
      }

      return {
        stream: response.Body as unknown as NodeJS.ReadableStream,
        contentType: response.ContentType ?? 'application/octet-stream',
        sizeBytes: response.ContentLength ?? 0,
      };
    } catch (error) {
      if ((error as { name?: string }).name === 'NoSuchKey') {
        throw AppError.notFound('File in storage');
      }
      throw AppError.storageError(`S3 download failed: ${(error as Error).message}`);
    }
  }

  async delete(storagePath: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storagePath }),
    );
  }

  async generatePresignedUrl(storagePath: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storagePath }),
      { expiresIn: expiresInSeconds },
    );
  }

  async exists(storagePath: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: storagePath }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
