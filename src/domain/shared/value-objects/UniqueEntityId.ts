import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { AppError } from '@shared/errors/AppError';

export class UniqueEntityId {
  private readonly _value: string;

  constructor(value?: string) {
    const id = value ?? uuidv4();
    if (!uuidValidate(id)) {
      throw AppError.validation(`Invalid UUID: ${id}`);
    }
    this._value = id;
  }

  get value(): string {
    return this._value;
  }

  equals(other: UniqueEntityId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static generate(): UniqueEntityId {
    return new UniqueEntityId();
  }
}
