import { createHash } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { jwtVerify } from 'jose';
import config from '@/config/index.ts';
import db from '@/infrastructure/database/drizzle/index.ts';
import { refreshTokens, users } from '@/infrastructure/database/drizzle/schema.ts';
import { ACCESS_TOKEN_COOKIE, UnauthorizedError } from '@/shared/index.ts';

const jwtKey = new TextEncoder().encode(config.app.jwtSecret);

function isWhitelisted(path: string, whitelists: string[] = []): boolean {
  for (const route of whitelists) {
    const pattern = route.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return true;
    }
  }
  return false;
}

export default async function requireAuth(c: Context, next: Next) {
  const path = c.req.path;
  if (isWhitelisted(path, config.app.wlroutes)) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  const token = authHeader?.match(/^Bearer (.+)$/i)?.[1] || getCookie(c, ACCESS_TOKEN_COOKIE);
  if (!token) {
    throw new UnauthorizedError('Token not found');
  }

  let sid: unknown;
  try {
    const { payload } = await jwtVerify(token, jwtKey, { algorithms: ['HS256'] });
    sid = payload.sid;
  } catch {
    throw new UnauthorizedError('Token is invalid or expired');
  }

  if (typeof sid !== 'string') {
    throw new UnauthorizedError('Invalid token');
  }

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(refreshTokens)
    .innerJoin(users, eq(users.id, refreshTokens.userId))
    .where(
      and(
        eq(refreshTokens.id, sid),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) {
    throw new UnauthorizedError('Session has expired, please log in again');
  }

  c.set('user', row);
  c.set('sessionId', sid);
  return next();
}
