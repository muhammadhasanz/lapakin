import { eq } from 'drizzle-orm';
import db from '@/infrastructure/database/drizzle/index.ts';
import { type UserRow, users } from '@/infrastructure/database/drizzle/schema.ts';
import { Service } from '@/shared/index.ts';
import type { User } from '../domain/User.ts';
import { UserMapper } from '../mappers/UserMapper.ts';

@Service()
export default class UserRepo {
  async findByEmail(email: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!row) return null;
    return UserMapper.toDomain(row);
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!row) return null;
    return UserMapper.toDomain(row);
  }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);
    const [saved] = await db
      .insert(users)
      .values({
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password!,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { password: data.password! },
      })
      .returning();
    return UserMapper.toDomain(saved as UserRow);
  }
}
