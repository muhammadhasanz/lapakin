import { describe, expect, it } from 'vitest';
import config from '@/config/index.ts';
import { app, loginAsAdmin } from './setup.ts';

describe('Auth Integration Tests', () => {
  it('should reject request without token with 401', async () => {
    const res = await app.app.request('/api/auth/me', {
      method: 'GET',
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.message).toContain('Token not found');
  });

  it('should login successfully with seed admin credentials', async () => {
    const res = await app.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.app.seedAdminEmail,
        password: config.app.seedAdminPassword,
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.access_token).toBeDefined();
    expect(body.data.refresh_token).toBeDefined();
    expect(body.data.user.email).toBe(config.app.seedAdminEmail);
  });

  it('should reject login with wrong password', async () => {
    const res = await app.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.app.seedAdminEmail,
        password: 'PasswordSalah123',
      }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.message).toBe('Incorrect email or password');
  });

  it('should return 422 when login input validation fails', async () => {
    const res = await app.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bukan-email',
      }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.errors).toBeDefined();
    expect(body.errors.email).toBeDefined();
  });

  it('should get /me profile with valid token', async () => {
    const token = await loginAsAdmin();
    const res = await app.app.request('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(config.app.seedAdminEmail);
  });

  it('should rotate the refresh token and revoke the old one', async () => {
    const loginRes = await app.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.app.seedAdminEmail,
        password: config.app.seedAdminPassword,
      }),
    });
    const loginBody = (await loginRes.json()) as any;
    const oldRefreshToken = loginBody.data.refresh_token;

    // Refresh pertama: sukses
    const refreshRes = await app.app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: oldRefreshToken }),
    });
    expect(refreshRes.status).toBe(200);
    const refreshBody = (await refreshRes.json()) as any;
    expect(refreshBody.data.access_token).toBeDefined();
    expect(refreshBody.data.refresh_token).toBeDefined();

    // Refresh kedua dengan token yang sama: harus gagal (401)
    const reuseRes = await app.app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: oldRefreshToken }),
    });
    expect(reuseRes.status).toBe(401);
  });

  it('should support authentication via HttpOnly cookies (access_token & refresh_token)', async () => {
    // 1. Login dan ambil Set-Cookie
    const loginRes = await app.app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.app.seedAdminEmail,
        password: config.app.seedAdminPassword,
      }),
    });
    expect(loginRes.status).toBe(200);

    const setCookies = loginRes.headers.getSetCookie();
    expect(setCookies.some((c) => c.includes('lapakin_access_token='))).toBe(true);
    expect(setCookies.some((c) => c.includes('lapakin_refresh_token='))).toBe(true);
    expect(setCookies.every((c) => c.toLowerCase().includes('httponly'))).toBe(true);

    const accessCookie = setCookies
      .find((c) => c.startsWith('lapakin_access_token='))
      ?.split(';')[0];
    const refreshCookie = setCookies
      .find((c) => c.startsWith('lapakin_refresh_token='))
      ?.split(';')[0];

    // 2. Akses /api/auth/me menggunakan Cookie tanpa header Authorization
    const meRes = await app.app.request('/api/auth/me', {
      method: 'GET',
      headers: {
        Cookie: accessCookie!,
      },
    });
    expect(meRes.status).toBe(200);
    const meBody = (await meRes.json()) as any;
    expect(meBody.data.email).toBe(config.app.seedAdminEmail);

    // 3. Refresh menggunakan Cookie tanpa body JSON
    const refreshRes = await app.app.request('/api/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: refreshCookie!,
      },
    });
    expect(refreshRes.status).toBe(200);
  });
});
