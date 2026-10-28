import { Entity, type UniqueId } from '@/shared/index.ts';
import { UserId } from './UserId.ts';

export interface UserProps {
  name: string;
  email: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Entity<UserProps> {
  get id(): string {
    return this._id.toString();
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string | undefined {
    return this.props.password;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private constructor(props: UserProps, id?: UniqueId) {
    super(props, id);
  }

  public static create(props: UserProps, id?: UniqueId): User {
    return new User(props, id ?? new UserId());
  }
}
