import { ValueObject } from '@domain/shared/ValueObject';
import { AppError } from '@shared/errors/AppError';

interface PasswordProps {
  hashed: string;
}

export class Password extends ValueObject<PasswordProps> {
  private static readonly MIN_LENGTH = 8;

  private constructor(props: PasswordProps) {
    super(props);
  }

  /**
   * Creates a Password from an already-hashed string (loaded from DB).
   */
  static fromHash(hash: string): Password {
    return new Password({ hashed: hash });
  }

  /**
   * Validates a raw password before hashing.
   */
  static validateRaw(raw: string): void {
    if (raw.length < Password.MIN_LENGTH) {
      throw AppError.validation(
        `Password must be at least ${Password.MIN_LENGTH} characters long`,
      );
    }
    if (!/[A-Z]/.test(raw)) {
      throw AppError.validation('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(raw)) {
      throw AppError.validation('Password must contain at least one number');
    }
  }

  get hashed(): string {
    return this.props.hashed;
  }
}
