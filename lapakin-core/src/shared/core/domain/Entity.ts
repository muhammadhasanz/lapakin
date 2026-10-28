import { UniqueId } from './UniqueId.ts';

export abstract class Entity<T> {
  protected readonly _id: UniqueId;
  public readonly props: T;

  constructor(props: T, id?: UniqueId) {
    this._id = id ?? new UniqueId();
    this.props = props;
  }
}
