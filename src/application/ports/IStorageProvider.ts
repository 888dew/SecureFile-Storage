export interface StorageUploadResult {
  storedName: string;
  storagePath: string;
  sizeBytes: number;
  checksum: string;
}

export interface StorageDownloadResult {
  stream: NodeJS.ReadableStream;
  contentType: string;
  sizeBytes: number;
}

export interface IStorageProvider {
  upload(params: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    ownerId: string;
    fileId: string;
  }): Promise<StorageUploadResult>;

  download(storagePath: string): Promise<StorageDownloadResult>;

  delete(storagePath: string): Promise<void>;

  generatePresignedUrl(storagePath: string, expiresInSeconds: number): Promise<string>;

  exists(storagePath: string): Promise<boolean>;
}
