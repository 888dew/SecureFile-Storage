import { Email } from '@domain/user/value-objects/Email';
import { AppError } from '@shared/errors/AppError';

describe('Email Value Object', () => {
  it('should create a valid email and normalize to lowercase', () => {
    const email = Email.create('John.Doe@Example.COM');
    expect(email.value).toBe('john.doe@example.com');
  });

  it('should throw for an invalid email', () => {
    expect(() => Email.create('not-an-email')).toThrow(AppError);
  });

  it('should throw for empty email', () => {
    expect(() => Email.create('')).toThrow(AppError);
  });

  it('should consider two emails with same value equal', () => {
    const a = Email.create('test@example.com');
    const b = Email.create('TEST@EXAMPLE.COM');
    expect(a.equals(b)).toBe(true);
  });

  it('should consider two different emails unequal', () => {
    const a = Email.create('a@example.com');
    const b = Email.create('b@example.com');
    expect(a.equals(b)).toBe(false);
  });
});
