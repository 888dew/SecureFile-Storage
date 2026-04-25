import jwt, { SignOptions } from 'jsonwebtoken';
import { ITokenProvider, TokenPayload, TokenPair } from '@application/ports/ITokenProvider';
import { AppError } from '@shared/errors/AppError';
import { env } from '@shared/config/env';

export class JwtTokenProvider implements ITokenProvider {
  async generateTokenPair(payload: Omit<TokenPayload, 'type'>): Promise<TokenPair> {
    const accessPayload: TokenPayload = { ...payload, type: 'access' };
    const refreshPayload: TokenPayload = { ...payload, type: 'refresh' };

    const accessOptions: SignOptions = {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    };
    const refreshOptions: SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, accessOptions);
    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, refreshOptions);

    // Parse expiresIn to seconds for the response
    const expiresIn = this.parseExpiresIn(env.JWT_ACCESS_EXPIRES_IN);

    return { accessToken, refreshToken, expiresIn };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
      if (payload.type !== 'access') {
        throw AppError.unauthorized('Invalid token type');
      }
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Access token expired', 401, 'TOKEN_EXPIRED');
      }
      if (error instanceof AppError) throw error;
      throw AppError.unauthorized('Invalid access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
      if (payload.type !== 'refresh') {
        throw AppError.unauthorized('Invalid token type');
      }
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token expired', 401, 'TOKEN_EXPIRED');
      }
      if (error instanceof AppError) throw error;
      throw AppError.unauthorized('Invalid refresh token');
    }
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }

  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const [, num, unit] = match;
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(num, 10) * (multipliers[unit] ?? 60);
  }
}
