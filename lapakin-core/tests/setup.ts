import 'reflect-metadata';
import config from '@/config/index.ts';
import app from '@/infrastructure/http/app.ts';

export async function loginAsAdmin(): Promise<string> {
  const res = await app.app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: config.app.seedAdminEmail,
      password: config.app.seedAdminPassword,
    }),
  });

  const body = (await res.json()) as any;
  if (!body.success) {
    throw new Error(`Failed to login as admin: ${JSON.stringify(body)}`);
  }
  return body.data.access_token;
}

export { app };
