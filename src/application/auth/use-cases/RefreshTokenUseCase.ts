import { ITokenProvider } from '@application/ports/ITokenProvider';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { IUserRepository } from '@domain/user/repositories/IUserRepository';
import { UniqueEntityId } from '@domain/shared/value-objects/UniqueEntityId';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class RefreshTokenUseCase {
  private readonly log = createChildLogger('RefreshTokenUseCase');

  constructor(
    private readonly tokenProvider: ITokenProvider,
    private readonly cacheProvider: ICacheProvider,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const payload = await this.tokenProvider.verifyRefreshToken(input.refreshToken).catch(() => {
      throw new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID');
    });

    // Check token is not revoked (blacklisted)
    const blacklistKey = `blacklist:${input.refreshToken}`;
    const isBlacklisted = await this.cacheProvider.exists(blacklistKey);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked', 401, 'TOKEN_INVALID');
    }

    const user = await this.userRepository.findById(new UniqueEntityId(payload.sub));
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User account not found or inactive');
    }

    // Revoke old refresh token (rotation)
    await this.cacheProvider.set(blacklistKey, true, 7 * 24 * 60 * 60);

    const tokens = await this.tokenProvider.generateTokenPair({
      sub: user.id.value,
      email: user.email.value,
      role: user.role,
    });

    const newRefreshKey = `refresh:${user.id.value}:${tokens.refreshToken.slice(-10)}`;
    await this.cacheProvider.set(newRefreshKey, true, 7 * 24 * 60 * 60);

    this.log.info({ userId: user.id.value }, 'Token refreshed');

    return tokens;
  }
}
