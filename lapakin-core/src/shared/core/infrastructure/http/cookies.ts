import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import config from '@/config/index.ts';

export const ACCESS_TOKEN_COOKIE = 'lapakin_access_token';
export const REFRESH_TOKEN_COOKIE = 'lapakin_refresh_token';

const isProduction = process.env.NODE_ENV === 'production';

export function setAuthCookies(c: Context, accessToken: string, refreshToken: string): void {
  setCookie(c, ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Lax',
    path: '/',
    maxAge: config.app.jwtAccessTtlSec,
  });

  setCookie(c, REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Lax',
    path: '/',
    maxAge: config.app.refreshTtlDays * 24 * 60 * 60,
  });
}

export function clearAuthCookies(c: Context): void {
  deleteCookie(c, ACCESS_TOKEN_COOKIE, { path: '/' });
  deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: '/' });
}

export function getAuthCookies(c: Context) {
  return {
    accessToken: getCookie(c, ACCESS_TOKEN_COOKIE),
    refreshToken: getCookie(c, REFRESH_TOKEN_COOKIE),
  };
}
