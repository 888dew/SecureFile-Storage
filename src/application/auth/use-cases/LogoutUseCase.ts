import { ICacheProvider } from '@application/ports/ICacheProvider';
import { ITokenProvider } from '@application/ports/ITokenProvider';
import { AppError } from '@shared/errors/AppError';
import { createChildLogger } from '@shared/logger/logger';

export interface LogoutInput {
  accessToken: string;
  refreshToken?: string;
}

export class LogoutUseCase {
  private readonly log = createChildLogger('LogoutUseCase');

  constructor(
    private readonly tokenProvider: ITokenProvider,
    private readonly cacheProvider: ICacheProvider,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    // Decode without throwing — token may already be expired
    const payload = this.tokenProvider.decodeToken(input.accessToken);
    if (!payload) {
      throw AppError.unauthorized('Invalid token');
    }

    // Blacklist access token until its expiry
    const accessKey = `blacklist:${input.accessToken}`;
    await this.cacheProvider.set(accessKey, true, 15 * 60); // 15 min (access token TTL)

    // Blacklist refresh token if provided
    if (input.refreshToken) {
      const refreshKey = `blacklist:${input.refreshToken}`;
      await this.cacheProvider.set(refreshKey, true, 7 * 24 * 60 * 60);
    }

    this.log.info({ userId: payload.sub }, 'User logged out');
  }
}
