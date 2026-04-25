import { LoginUseCase } from '@application/auth/use-cases/LoginUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IHashProvider } from '@application/ports/IHashProvider';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { User } from '@domain/user/entities/User';
import { Email } from '@domain/user/value-objects/Email';
import { Password } from '@domain/user/value-objects/Password';

function makeActiveUser(): User {
  return User.create({
    name: 'John Doe',
    email: Email.create('john@example.com'),
    password: Password.fromHash('$2b$12$hashed'),
    role: 'user',
  });
}

const makeUserRepository = (user: User | null = makeActiveUser()): jest.Mocked<IUserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn().mockResolvedValue(user),
  save: jest.fn(),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
  existsByEmail: jest.fn(),
});

const makeHashProvider = (match: boolean): jest.Mocked<IHashProvider> => ({
  hash: jest.fn(),
  compare: jest.fn().mockResolvedValue(match),
});

const makeTokenProvider = (): jest.Mocked<ITokenProvider> => ({
  generateTokenPair: jest.fn().mockResolvedValue({
    accessToken: 'at',
    refreshToken: 'rt',
    expiresIn: 900,
  }),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  decodeToken: jest.fn(),
});

const makeCacheProvider = (): jest.Mocked<ICacheProvider> => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn(),
  increment: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(undefined),
  addToSet: jest.fn(),
  isMemberOfSet: jest.fn(),
});

describe('LoginUseCase', () => {
  it('should login successfully with correct credentials', async () => {
    const useCase = new LoginUseCase(
      makeUserRepository(),
      makeHashProvider(true),
      makeTokenProvider(),
      makeCacheProvider(),
    );

    const result = await useCase.execute({ email: 'john@example.com', password: 'password123' });

    expect(result.accessToken).toBe('at');
    expect(result.user.email).toBe('john@example.com');
  });

  it('should throw UNAUTHORIZED when user not found', async () => {
    const useCase = new LoginUseCase(
      makeUserRepository(null),
      makeHashProvider(false),
      makeTokenProvider(),
      makeCacheProvider(),
    );

    await expect(
      useCase.execute({ email: 'no@example.com', password: 'pw' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('should throw UNAUTHORIZED when password does not match', async () => {
    const useCase = new LoginUseCase(
      makeUserRepository(),
      makeHashProvider(false),
      makeTokenProvider(),
      makeCacheProvider(),
    );

    await expect(
      useCase.execute({ email: 'john@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('should throw RATE_LIMIT_EXCEEDED when brute-force threshold is hit', async () => {
    const cache = makeCacheProvider();
    cache.get.mockResolvedValue(5); // 5 failed attempts

    const useCase = new LoginUseCase(
      makeUserRepository(),
      makeHashProvider(false),
      makeTokenProvider(),
      cache,
    );

    await expect(
      useCase.execute({ email: 'john@example.com', password: 'pw' }),
    ).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' });
  });
});
