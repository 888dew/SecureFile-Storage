import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IHashProvider } from '@application/ports/IHashProvider';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export interface LoginOutput {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const BRUTE_FORCE_MAX_ATTEMPTS = 5;
const BRUTE_FORCE_WINDOW_SECONDS = 900; // 15 min

export class LoginUseCase {
  private readonly log = createChildLogger('LoginUseCase');

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashProvider: IHashProvider,
    private readonly tokenProvider: ITokenProvider,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const parsed = LoginSchema.parse(input);
    const email = parsed.email.toLowerCase().trim();
    const bruteKey = `login_attempts:${email}`;

    // Brute-force protection
    const attempts = await this.cacheProvider.get<number>(bruteKey);
    if (attempts && attempts >= BRUTE_FORCE_MAX_ATTEMPTS) {
      this.log.warn({ email }, 'Brute-force threshold exceeded');
      throw AppError.rateLimitExceeded('Too many login attempts. Please try again later.');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.incrementAttempts(bruteKey);
      throw AppError.unauthorized('Invalid credentials');
    }

    if (!user.isActive) {
      throw AppError.unauthorized('Account is deactivated');
    }

    const passwordMatch = await this.hashProvider.compare(
      parsed.password,
      user.password.hashed,
    );

    if (!passwordMatch) {
      await this.incrementAttempts(bruteKey);
      this.log.warn({ userId: user.id.value }, 'Failed login attempt');
      throw AppError.unauthorized('Invalid credentials');
    }

    // Clear brute-force counter on successful login
    await this.cacheProvider.del(bruteKey);

    user.recordLogin();
    await this.userRepository.update(user);

    const tokens = await this.tokenProvider.generateTokenPair({
      sub: user.id.value,
      email: user.email.value,
      role: user.role,
    });

    const refreshKey = `refresh:${user.id.value}:${tokens.refreshToken.slice(-10)}`;
    await this.cacheProvider.set(refreshKey, true, 7 * 24 * 60 * 60);

    this.log.info({ userId: user.id.value }, 'User logged in');

    return {
      user: {
        id: user.id.value,
        name: user.name,
        email: user.email.value,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  private async incrementAttempts(key: string): Promise<void> {
    const count = await this.cacheProvider.increment(key);
    if (count === 1) {
      await this.cacheProvider.expire(key, BRUTE_FORCE_WINDOW_SECONDS);
    }
  }
}
