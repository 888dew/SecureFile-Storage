import { User } from '@domain/user/entities/User';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';

export interface IUserRepository {
  findById(id: UniqueEntityId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: UniqueEntityId): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
}
