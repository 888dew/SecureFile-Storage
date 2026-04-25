import bcrypt from 'bcryptjs';
import { IHashProvider } from '@application/ports/IHashProvider';
import { env } from '@shared/config/env';

export class BcryptHashProvider implements IHashProvider {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
