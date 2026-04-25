import { DataSource, Repository } from 'typeorm';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { User } from '@domain/user/entities/User';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { Email } from '@domain/user/value-objects/Email';
import { Password } from '@domain/user/value-objects/Password';
import { UserEntity } from '../entities/UserEntity';

export class TypeOrmUserRepository implements IUserRepository {
  private readonly repo: Repository<UserEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserEntity);
  }

  async findById(id: UniqueEntityId): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { email: email.toLowerCase() } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<void> {
    const entity = this.toPersistence(user);
    await this.repo.save(entity);
  }

  async update(user: User): Promise<void> {
    const entity = this.toPersistence(user);
    await this.repo.save(entity);
  }

  async delete(id: UniqueEntityId): Promise<void> {
    await this.repo.delete({ id: id.value });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repo.count({ where: { email: email.toLowerCase() } });
    return count > 0;
  }

  private toDomain(entity: UserEntity): User {
    return User.reconstitute(
      {
        name: entity.name,
        email: Email.create(entity.email),
        password: Password.fromHash(entity.passwordHash),
        role: entity.role,
        isActive: entity.isActive,
        storageUsedBytes: parseInt(entity.storageUsedBytes, 10),
        storageLimitBytes: parseInt(entity.storageLimitBytes, 10),
        lastLoginAt: entity.lastLoginAt,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      new UniqueEntityId(entity.id),
    );
  }

  private toPersistence(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id.value;
    entity.name = user.name;
    entity.email = user.email.value;
    entity.passwordHash = user.password.hashed;
    entity.role = user.role;
    entity.isActive = user.isActive;
    entity.storageUsedBytes = user.storageUsedBytes.toString();
    entity.storageLimitBytes = user.storageLimitBytes.toString();
    entity.lastLoginAt = user.lastLoginAt;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }
}
