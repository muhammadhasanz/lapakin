import type { UserRow } from '@/infrastructure/database/drizzle/schema.ts';
import { Mapper, UniqueId } from '@/shared/index.ts';
import { User } from '../domain/User.ts';

export class UserMapper extends Mapper<User> {
  public static toDomain(raw: UserRow): User {
    return User.create(
      {
        name: raw.name,
        email: raw.email,
        password: raw.password,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueId(raw.id),
    );
  }

  public static toPersistence(user: User): {
    id: string;
    name: string;
    email: string;
    password?: string;
  } {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      ...(user.password ? { password: user.password } : {}),
    };
  }

  public static toDTO(user: User | { id: string; name: string; email: string }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
