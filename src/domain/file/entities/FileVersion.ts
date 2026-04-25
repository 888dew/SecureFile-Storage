import { Entity } from '@domain/shared/Entity';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';

export interface FileVersionProps {
  fileId: UniqueEntityId;
  versionNumber: number;
  storedName: string;
  storagePath: string;
  sizeBytes: number;
  checksum: string;
  mimeType: string;
  uploadedBy: UniqueEntityId;
  changeNote: string | null;
  createdAt: Date;
}

export class FileVersion extends Entity<FileVersionProps> {
  private constructor(props: FileVersionProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    props: Omit<FileVersionProps, 'createdAt'>,
    id?: UniqueEntityId,
  ): FileVersion {
    return new FileVersion({ ...props, createdAt: new Date() }, id);
  }

  static reconstitute(props: FileVersionProps, id: UniqueEntityId): FileVersion {
    return new FileVersion(props, id);
  }

  get fileId(): UniqueEntityId { return this.props.fileId; }
  get versionNumber(): number { return this.props.versionNumber; }
  get storedName(): string { return this.props.storedName; }
  get storagePath(): string { return this.props.storagePath; }
  get sizeBytes(): number { return this.props.sizeBytes; }
  get checksum(): string { return this.props.checksum; }
  get mimeType(): string { return this.props.mimeType; }
  get uploadedBy(): UniqueEntityId { return this.props.uploadedBy; }
  get changeNote(): string | null { return this.props.changeNote; }
  get createdAt(): Date { return this.props.createdAt; }
}
