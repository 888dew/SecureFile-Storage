import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FileEntity } from './FileEntity';

@Entity('shares')
export class ShareEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'file_id' })
  fileId!: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ unique: true, length: 64 })
  @Index()
  token!: string;

  @Column({
    type: 'enum',
    enum: ['view', 'download'],
    default: 'download',
  })
  permission!: 'view' | 'download';

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'max_downloads', nullable: true, type: 'int' })
  maxDownloads!: number | null;

  @Column({ name: 'download_count', default: 0 })
  downloadCount!: number;

  @Column({ name: 'is_revoked', default: false })
  isRevoked!: boolean;

  @Column({ name: 'allowed_emails', type: 'text', array: true, default: '{}' })
  allowedEmails!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => FileEntity, (file) => file.shares)
  @JoinColumn({ name: 'file_id' })
  file!: FileEntity;
}
