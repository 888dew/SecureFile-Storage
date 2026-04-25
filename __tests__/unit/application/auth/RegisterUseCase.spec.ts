import { RegisterUseCase } from '@application/auth/use-cases/RegisterUseCase';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IHashProvider } from '@application/ports/IHashProvider';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { AppError } from '@shared/errors/AppError';

const makeUserRepository = (): jest.Mocked<IUserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
  existsByEmail: jest.fn().mockResolvedValue(false),
});

const makeHashProvider = (): jest.Mocked<IHashProvider> => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn(),
});

const makeTokenProvider = (): jest.Mocked<ITokenProvider> => ({
  generateTokenPair: jest.fn().mockResolvedValue({
    accessToken: 'access.token.here',
    refreshToken: 'refresh.token.here',
    expiresIn: 900,
  }),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  decodeToken: jest.fn(),
});

const makeCacheProvider = (): jest.Mocked<ICacheProvider> => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn(),
  exists: jest.fn(),
  increment: jest.fn(),
  expire: jest.fn(),
  addToSet: jest.fn(),
  isMemberOfSet: jest.fn(),
});

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let hashProvider: jest.Mocked<IHashProvider>;
  let tokenProvider: jest.Mocked<ITokenProvider>;
  let cacheProvider: jest.Mocked<ICacheProvider>;

  beforeEach(() => {
    userRepo = makeUserRepository();
    hashProvider = makeHashProvider();
    tokenProvider = makeTokenProvider();
    cacheProvider = makeCacheProvider();
    useCase = new RegisterUseCase(userRepo, hashProvider, tokenProvider, cacheProvider);
  });

  it('should register a user successfully and return tokens', async () => {
    const result = await useCase.execute({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'StrongPass1',
    });

    expect(result.user.email).toBe('jane@example.com');
    expect(result.accessToken).toBe('access.token.here');
    expect(result.refreshToken).toBe('refresh.token.here');
    expect(userRepo.save).toHaveBeenCalledTimes(1);
    expect(hashProvider.hash).toHaveBeenCalledWith('StrongPass1');
    expect(cacheProvider.set).toHaveBeenCalled();
  });

  it('should throw CONFLICT if email already exists', async () => {
    userRepo.existsByEmail.mockResolvedValue(true);

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'StrongPass1',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('should throw for weak password (too short)', async () => {
    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'weak',
      }),
    ).rejects.toThrow(); // Zod min(8) fires before domain validation
  });

  it('should throw VALIDATION_ERROR for invalid email', async () => {
    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'StrongPass1',
      }),
    ).rejects.toThrow();
  });
});
