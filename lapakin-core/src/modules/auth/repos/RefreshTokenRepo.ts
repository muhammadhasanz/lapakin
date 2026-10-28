import { and, eq, gt, isNull } from 'drizzle-orm';
import db from '@/infrastructure/database/drizzle/index.ts';
import { type RefreshTokenRow, refreshTokens } from '@/infrastructure/database/drizzle/schema.ts';
import { Service, UniqueId } from '@/shared/index.ts';
import { RefreshToken } from '../domain/RefreshToken.ts';

@Service()
export default class RefreshTokenRepo {
  async save(token: RefreshToken): Promise<RefreshToken> {
    const [saved] = await db
      .insert(refreshTokens)
      .values({
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      })
      .returning();

    return RefreshToken.create(
      {
        userId: saved!.userId,
        tokenHash: saved!.tokenHash,
        expiresAt: saved!.expiresAt,
        revokedAt: saved!.revokedAt,
        createdAt: saved!.createdAt,
      },
      new UniqueId(saved!.id),
    );
  }

  async findActiveByHash(hash: string): Promise<RefreshToken | null> {
    const [row] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, hash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) return null;
    return RefreshToken.create(
      {
        userId: row.userId,
        tokenHash: row.tokenHash,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
      },
      new UniqueId(row.id),
    );
  }

  async revoke(id: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.id, id), isNull(refreshTokens.revokedAt)));
  }

  async revokeByHash(hash: string): Promise<string | null> {
    const [revoked] = await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.tokenHash, hash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: refreshTokens.userId });

    return revoked?.userId ?? null;
  }
}
