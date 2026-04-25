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

@Entity('file_versions')
@Index(['fileId'])
export class FileVersionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'file_id' })
  fileId!: string;

  @Column({ name: 'version_number' })
  versionNumber!: number;

  @Column({ name: 'stored_name', length: 500 })
  storedName!: string;

  @Column({ name: 'storage_path', length: 1000 })
  storagePath!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Column({ length: 64 })
  checksum!: string;

  @Column({ name: 'mime_type', length: 255 })
  mimeType!: string;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @Column({ name: 'change_note', length: 1000, nullable: true })
  changeNote!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => FileEntity, (file) => file.versions)
  @JoinColumn({ name: 'file_id' })
  file!: FileEntity;
}
