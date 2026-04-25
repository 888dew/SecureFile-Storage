import { Entity } from '@domain/shared/Entity';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';

export type SharePermission = 'view' | 'download';

export interface ShareProps {
  fileId: UniqueEntityId;
  createdBy: UniqueEntityId;
  token: string;
  permission: SharePermission;
  expiresAt: Date;
  maxDownloads: number | null;
  downloadCount: number;
  isRevoked: boolean;
  allowedEmails: string[];
  createdAt: Date;
}

export class Share extends Entity<ShareProps> {
  private constructor(props: ShareProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    props: Omit<ShareProps, 'downloadCount' | 'isRevoked' | 'createdAt'>,
    id?: UniqueEntityId,
  ): Share {
    return new Share(
      { ...props, downloadCount: 0, isRevoked: false, createdAt: new Date() },
      id,
    );
  }

  static reconstitute(props: ShareProps, id: UniqueEntityId): Share {
    return new Share(props, id);
  }

  get fileId(): UniqueEntityId { return this.props.fileId; }
  get createdBy(): UniqueEntityId { return this.props.createdBy; }
  get token(): string { return this.props.token; }
  get permission(): SharePermission { return this.props.permission; }
  get expiresAt(): Date { return this.props.expiresAt; }
  get maxDownloads(): number | null { return this.props.maxDownloads; }
  get downloadCount(): number { return this.props.downloadCount; }
  get isRevoked(): boolean { return this.props.isRevoked; }
  get allowedEmails(): string[] { return this.props.allowedEmails; }
  get createdAt(): Date { return this.props.createdAt; }

  isValid(): boolean {
    if (this.props.isRevoked) return false;
    if (new Date() > this.props.expiresAt) return false;
    if (this.props.maxDownloads !== null && this.props.downloadCount >= this.props.maxDownloads) {
      return false;
    }
    return true;
  }

  recordAccess(): void {
    this.props.downloadCount += 1;
  }

  revoke(): void {
    this.props.isRevoked = true;
  }

  isEmailAllowed(email: string): boolean {
    if (this.props.allowedEmails.length === 0) return true;
    return this.props.allowedEmails.includes(email.toLowerCase());
  }
}
