import { Entity } from '@domain/shared/Entity';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { Email } from '@domain/user/value-objects/Email';
import { Password } from '@domain/user/value-objects/Password';

export type UserRole = 'admin' | 'user';

export interface UserProps {
  name: string;
  email: Email;
  password: Password;
  role: UserRole;
  isActive: boolean;
  storageUsedBytes: number;
  storageLimitBytes: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    props: Omit<UserProps, 'isActive' | 'storageUsedBytes' | 'storageLimitBytes' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> & {
      storageLimitBytes?: number;
    },
    id?: UniqueEntityId,
  ): User {
    const now = new Date();
    return new User(
      {
        ...props,
        isActive: true,
        storageUsedBytes: 0,
        storageLimitBytes: props.storageLimitBytes ?? 10 * 1024 * 1024 * 1024, // 10GB default
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static reconstitute(props: UserProps, id: UniqueEntityId): User {
    return new User(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get storageUsedBytes(): number {
    return this.props.storageUsedBytes;
  }

  get storageLimitBytes(): number {
    return this.props.storageLimitBytes;
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasStorageAvailable(fileSizeBytes: number): boolean {
    return this.props.storageUsedBytes + fileSizeBytes <= this.props.storageLimitBytes;
  }

  incrementStorage(bytes: number): void {
    this.props.storageUsedBytes += bytes;
    this.props.updatedAt = new Date();
  }

  decrementStorage(bytes: number): void {
    this.props.storageUsedBytes = Math.max(0, this.props.storageUsedBytes - bytes);
    this.props.updatedAt = new Date();
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  isAdmin(): boolean {
    return this.props.role === 'admin';
  }
}
