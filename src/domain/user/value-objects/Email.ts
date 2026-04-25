import { ValueObject } from '@domain/shared/ValueObject';
import { AppError } from '@shared/errors/AppError';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  static create(email: string): Email {
    const normalized = email.trim().toLowerCase();
    if (!Email.REGEX.test(normalized)) {
      throw AppError.validation(`Invalid email address: ${email}`);
    }
    return new Email({ value: normalized });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
