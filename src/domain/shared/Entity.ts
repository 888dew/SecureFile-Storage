import { UniqueEntityId } from './value-objects/UniqueEntityId';

export abstract class Entity<T> {
  protected readonly _id: UniqueEntityId;
  protected props: T;

  constructor(props: T, id?: UniqueEntityId) {
    this._id = id ?? UniqueEntityId.generate();
    this.props = props;
  }

  get id(): UniqueEntityId {
    return this._id;
  }

  equals(other: Entity<T>): boolean {
    if (other === this) return true;
    if (!(other instanceof Entity)) return false;
    return this._id.equals(other._id);
  }
}
