import { IFileRepository } from '@domain/file/repositories/IFileRepository';
import { IFileVersionRepository } from '@domain/file/repositories/IFileVersionRepository';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IStorageProvider } from '@application/ports/IStorageProvider';
import { IVirusScanProvider } from '@application/ports/IVirusScanProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { File } from '@domain/file/entities/File';
import { FileVersion } from '@domain/file/entities/FileVersion';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';
import { env } from '@shared/config/env';

export interface UploadFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  tags?: string[];
  metadata?: Record<string, string>;
  changeNote?: string;
  existingFileId?: string; // If set, creates a new version of an existing file
}

export interface UploadFileOutput {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  versionNumber: number;
  scanStatus: string;
  checksum: string;
  createdAt: Date;
}

const ALLOWED_TYPES = env.ALLOWED_MIME_TYPES.split(',').map((t) => t.trim());
const MAX_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export class UploadFileUseCase {
  private readonly log = createChildLogger('UploadFileUseCase');

  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly fileVersionRepository: IFileVersionRepository,
    private readonly userRepository: IUserRepository,
    private readonly storageProvider: IStorageProvider,
    private readonly virusScanProvider: IVirusScanProvider,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(input: UploadFileInput): Promise<UploadFileOutput> {
    // Validate type and size
    if (!ALLOWED_TYPES.includes(input.mimeType)) {
      throw AppError.invalidFileType(ALLOWED_TYPES);
    }
    if (input.sizeBytes > MAX_BYTES) {
      throw AppError.fileTooLarge(env.MAX_FILE_SIZE_MB);
    }

    const uploaderId = new UniqueEntityId(input.uploaderId);
    const user = await this.userRepository.findById(uploaderId);
    if (!user || !user.isActive) {
      throw AppError.notFound('User');
    }

    if (!user.hasStorageAvailable(input.sizeBytes)) {
      throw AppError.validation(
        `Storage quota exceeded. You have ${this.formatBytes(user.storageLimitBytes - user.storageUsedBytes)} remaining.`,
      );
    }

    // Virus scan (before storing)
    let scanResult = { outcome: 'skipped' as const };
    if (env.VIRUS_SCAN_ENABLED) {
      const available = await this.virusScanProvider.isAvailable();
      if (available) {
        const result = await this.virusScanProvider.scan(input.buffer, input.originalName);
        if (result.outcome === 'infected') {
          this.log.warn(
            { filename: input.originalName, virus: result.virusName },
            'Virus detected, rejecting upload',
          );
          throw AppError.virusDetected();
        }
        scanResult = result as typeof scanResult;
      }
    }

    // Upload to storage
    const stored = await this.storageProvider.upload({
      buffer: input.buffer,
      originalName: input.originalName,
      mimeType: input.mimeType,
      ownerId: input.uploaderId,
      fileId: input.existingFileId ?? 'new',
    });

    let file: File;
    let versionNumber: number;

    if (input.existingFileId) {
      // New version of existing file
      const existingFile = await this.fileRepository.findById(
        new UniqueEntityId(input.existingFileId),
      );
      if (!existingFile) throw AppError.notFound('File');
      if (!existingFile.isOwnedBy(uploaderId) && !user.isAdmin()) {
        throw AppError.forbidden('You do not have permission to update this file');
      }

      versionNumber = existingFile.versionCount + 1;
      const version = FileVersion.create({
        fileId: existingFile.id,
        versionNumber,
        storedName: stored.storedName,
        storagePath: stored.storagePath,
        sizeBytes: stored.sizeBytes,
        checksum: stored.checksum,
        mimeType: input.mimeType,
        uploadedBy: uploaderId,
        changeNote: input.changeNote ?? null,
      });

      await this.fileVersionRepository.save(version);
      existingFile.newVersionUploaded(version.id);
      this.applyScanStatus(existingFile, scanResult.outcome);
      await this.fileRepository.update(existingFile);

      file = existingFile;
    } else {
      // Brand new file
      versionNumber = 1;
      file = File.create({
        ownerId: uploaderId,
        originalName: input.originalName,
        storedName: stored.storedName,
        mimeType: input.mimeType,
        sizeBytes: stored.sizeBytes,
        storagePath: stored.storagePath,
        checksum: stored.checksum,
        tags: input.tags,
        metadata: input.metadata,
      });

      this.applyScanStatus(file, scanResult.outcome);
      await this.fileRepository.save(file);

      const version = FileVersion.create({
        fileId: file.id,
        versionNumber: 1,
        storedName: stored.storedName,
        storagePath: stored.storagePath,
        sizeBytes: stored.sizeBytes,
        checksum: stored.checksum,
        mimeType: input.mimeType,
        uploadedBy: uploaderId,
        changeNote: input.changeNote ?? null,
      });
      await this.fileVersionRepository.save(version);
    }

    // Update storage quota
    user.incrementStorage(stored.sizeBytes);
    await this.userRepository.update(user);

    // Invalidate file list cache
    await this.cacheProvider.del(`files:${input.uploaderId}`);

    this.log.info(
      { fileId: file.id.value, userId: input.uploaderId, size: stored.sizeBytes },
      'File uploaded',
    );

    return {
      id: file.id.value,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      versionNumber,
      scanStatus: file.scanStatus,
      checksum: file.checksum,
      createdAt: file.createdAt,
    };
  }

  private applyScanStatus(file: File, outcome: string): void {
    switch (outcome) {
      case 'clean': file.markClean(); break;
      case 'error': file.markScanError(); break;
      default: file.markScanSkipped(); break;
    }
  }

  private formatBytes(bytes: number): string {
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(1)}GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(1)}MB`;
  }
}
