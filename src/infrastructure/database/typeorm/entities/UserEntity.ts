import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { FileEntity } from './FileEntity';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 255 })
  @Index()
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'user'],
    default: 'user',
  })
  role!: 'admin' | 'user';

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'storage_used_bytes', type: 'bigint', default: 0 })
  storageUsedBytes!: string;

  @Column({ name: 'storage_limit_bytes', type: 'bigint', default: 10737418240 }) // 10GB
  storageLimitBytes!: string;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamptz' })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => FileEntity, (file) => file.owner)
  files!: FileEntity[];
}
