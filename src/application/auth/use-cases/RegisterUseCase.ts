import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { IHashProvider } from '@application/ports/IHashProvider';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { User } from '@domain/user/entities/User';
import { Email } from '@domain/user/value-objects/Email';
import { Password } from '@domain/user/value-objects/Password';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user').optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export interface RegisterOutput {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class RegisterUseCase {
  private readonly log = createChildLogger('RegisterUseCase');

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashProvider: IHashProvider,
    private readonly tokenProvider: ITokenProvider,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const parsed = RegisterSchema.parse(input);

    Password.validateRaw(parsed.password);

    const emailVo = Email.create(parsed.email);

    const exists = await this.userRepository.existsByEmail(emailVo.value);
    if (exists) {
      throw AppError.conflict('An account with this email already exists');
    }

    const hashedPassword = await this.hashProvider.hash(parsed.password);
    const password = Password.fromHash(hashedPassword);

    const user = User.create({
      name: parsed.name.trim(),
      email: emailVo,
      password,
      role: parsed.role ?? 'user',
    });

    await this.userRepository.save(user);

    const tokens = await this.tokenProvider.generateTokenPair({
      sub: user.id.value,
      email: user.email.value,
      role: user.role,
    });

    // Store refresh token in Redis for rotation tracking
    const refreshKey = `refresh:${user.id.value}:${tokens.refreshToken.slice(-10)}`;
    await this.cacheProvider.set(refreshKey, true, 7 * 24 * 60 * 60);

    this.log.info({ userId: user.id.value, email: user.email.value }, 'User registered');

    return {
      user: {
        id: user.id.value,
        name: user.name,
        email: user.email.value,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}
