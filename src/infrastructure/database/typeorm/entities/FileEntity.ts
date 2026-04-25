import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './UserEntity';
import { FileVersionEntity } from './FileVersionEntity';
import { ShareEntity } from './ShareEntity';

@Entity('files')
@Index(['ownerId', 'status'])
export class FileEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id' })
  ownerId!: string;

  @Column({ name: 'original_name', length: 500 })
  originalName!: string;

  @Column({ name: 'stored_name', length: 500 })
  storedName!: string;

  @Column({ name: 'mime_type', length: 255 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Column({ name: 'storage_path', length: 1000 })
  storagePath!: string;

  @Column({ length: 64 })
  checksum!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'deleted', 'quarantined'],
    default: 'active',
  })
  status!: 'active' | 'deleted' | 'quarantined';

  @Column({
    name: 'scan_status',
    type: 'enum',
    enum: ['pending', 'clean', 'infected', 'error', 'skipped'],
    default: 'pending',
  })
  scanStatus!: 'pending' | 'clean' | 'infected' | 'error' | 'skipped';

  @Column({ name: 'scan_result', length: 500, nullable: true })
  scanResult!: string | null;

  @Column({ name: 'current_version_id', nullable: true, type: 'uuid' })
  currentVersionId!: string | null;

  @Column({ name: 'version_count', default: 1 })
  versionCount!: number;

  @Column({ name: 'is_public', default: false })
  isPublic!: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, string>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', nullable: true, type: 'timestamptz' })
  deletedAt!: Date | null;

  @ManyToOne(() => UserEntity, (user) => user.files)
  @JoinColumn({ name: 'owner_id' })
  owner!: UserEntity;

  @OneToMany(() => FileVersionEntity, (version) => version.file)
  versions!: FileVersionEntity[];

  @OneToMany(() => ShareEntity, (share) => share.file)
  shares!: ShareEntity[];
}
