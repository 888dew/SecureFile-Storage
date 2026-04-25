import { User } from '@domain/user/entities/User';
import { Email } from '@domain/user/value-objects/Email';
import { Password } from '@domain/user/value-objects/Password';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';

describe('User Entity', () => {
  function createUser(overrides?: Partial<{ storageLimitBytes: number }>) {
    return User.create({
      name: 'John Doe',
      email: Email.create('john@example.com'),
      password: Password.fromHash('$2b$12$hashedpassword'),
      role: 'user',
      ...overrides,
    });
  }

  describe('create()', () => {
    it('should create a user with defaults', () => {
      const user = createUser();

      expect(user.name).toBe('John Doe');
      expect(user.email.value).toBe('john@example.com');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.storageUsedBytes).toBe(0);
      expect(user.lastLoginAt).toBeNull();
    });

    it('should generate a valid UUID id', () => {
      const user = createUser();
      expect(user.id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('hasStorageAvailable()', () => {
    it('should return true when under limit', () => {
      const user = createUser({ storageLimitBytes: 100 });
      expect(user.hasStorageAvailable(50)).toBe(true);
    });

    it('should return false when exceeding limit', () => {
      const user = createUser({ storageLimitBytes: 100 });
      expect(user.hasStorageAvailable(200)).toBe(false);
    });

    it('should account for already-used storage', () => {
      const user = createUser({ storageLimitBytes: 100 });
      user.incrementStorage(80);
      expect(user.hasStorageAvailable(30)).toBe(false);
      expect(user.hasStorageAvailable(20)).toBe(true);
    });
  });

  describe('incrementStorage()', () => {
    it('should increment storage and update timestamp', () => {
      const user = createUser();
      const before = user.updatedAt;
      user.incrementStorage(1024);
      expect(user.storageUsedBytes).toBe(1024);
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('decrementStorage()', () => {
    it('should decrement storage', () => {
      const user = createUser();
      user.incrementStorage(1000);
      user.decrementStorage(400);
      expect(user.storageUsedBytes).toBe(600);
    });

    it('should not go below zero', () => {
      const user = createUser();
      user.decrementStorage(999);
      expect(user.storageUsedBytes).toBe(0);
    });
  });

  describe('recordLogin()', () => {
    it('should set lastLoginAt to now', () => {
      const user = createUser();
      expect(user.lastLoginAt).toBeNull();
      user.recordLogin();
      expect(user.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('isAdmin()', () => {
    it('should return true for admin role', () => {
      const admin = User.create({
        name: 'Admin',
        email: Email.create('admin@example.com'),
        password: Password.fromHash('hash'),
        role: 'admin',
      });
      expect(admin.isAdmin()).toBe(true);
    });

    it('should return false for user role', () => {
      const user = createUser();
      expect(user.isAdmin()).toBe(false);
    });
  });
});
