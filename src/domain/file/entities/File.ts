import { Entity } from '@domain/shared/Entity';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';

export type FileStatus = 'active' | 'deleted' | 'quarantined';
export type ScanStatus = 'pending' | 'clean' | 'infected' | 'error' | 'skipped';

export interface FileProps {
  ownerId: UniqueEntityId;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  checksum: string;
  status: FileStatus;
  scanStatus: ScanStatus;
  scanResult: string | null;
  currentVersionId: UniqueEntityId | null;
  versionCount: number;
  isPublic: boolean;
  tags: string[];
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class File extends Entity<FileProps> {
  private constructor(props: FileProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    props: Pick<FileProps, 'ownerId' | 'originalName' | 'storedName' | 'mimeType' | 'sizeBytes' | 'storagePath' | 'checksum'> & {
      tags?: string[];
      metadata?: Record<string, string>;
      isPublic?: boolean;
    },
    id?: UniqueEntityId,
  ): File {
    const now = new Date();
    return new File(
      {
        ...props,
        status: 'active',
        scanStatus: 'pending',
        scanResult: null,
        currentVersionId: null,
        versionCount: 1,
        isPublic: props.isPublic ?? false,
        tags: props.tags ?? [],
        metadata: props.metadata ?? {},
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      id,
    );
  }

  static reconstitute(props: FileProps, id: UniqueEntityId): File {
    return new File(props, id);
  }

  get ownerId(): UniqueEntityId { return this.props.ownerId; }
  get originalName(): string { return this.props.originalName; }
  get storedName(): string { return this.props.storedName; }
  get mimeType(): string { return this.props.mimeType; }
  get sizeBytes(): number { return this.props.sizeBytes; }
  get storagePath(): string { return this.props.storagePath; }
  get checksum(): string { return this.props.checksum; }
  get status(): FileStatus { return this.props.status; }
  get scanStatus(): ScanStatus { return this.props.scanStatus; }
  get scanResult(): string | null { return this.props.scanResult; }
  get currentVersionId(): UniqueEntityId | null { return this.props.currentVersionId; }
  get versionCount(): number { return this.props.versionCount; }
  get isPublic(): boolean { return this.props.isPublic; }
  get tags(): string[] { return this.props.tags; }
  get metadata(): Record<string, string> { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null { return this.props.deletedAt; }

  isOwnedBy(userId: UniqueEntityId): boolean {
    return this.props.ownerId.equals(userId);
  }

  isAccessible(): boolean {
    return this.props.status === 'active' && this.props.scanStatus !== 'infected';
  }

  isScanClear(): boolean {
    return this.props.scanStatus === 'clean' || this.props.scanStatus === 'skipped';
  }

  markClean(): void {
    this.props.scanStatus = 'clean';
    this.props.scanResult = null;
    this.props.updatedAt = new Date();
  }

  markInfected(result: string): void {
    this.props.scanStatus = 'infected';
    this.props.scanResult = result;
    this.props.status = 'quarantined';
    this.props.updatedAt = new Date();
  }

  markScanError(): void {
    this.props.scanStatus = 'error';
    this.props.updatedAt = new Date();
  }

  markScanSkipped(): void {
    this.props.scanStatus = 'skipped';
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    const now = new Date();
    this.props.status = 'deleted';
    this.props.deletedAt = now;
    this.props.updatedAt = now;
  }

  newVersionUploaded(newVersionId: UniqueEntityId): void {
    this.props.currentVersionId = newVersionId;
    this.props.versionCount += 1;
    this.props.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, string>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.props.updatedAt = new Date();
  }

  togglePublic(isPublic: boolean): void {
    this.props.isPublic = isPublic;
    this.props.updatedAt = new Date();
  }
}
