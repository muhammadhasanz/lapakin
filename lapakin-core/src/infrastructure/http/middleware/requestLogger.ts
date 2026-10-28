import type { Context, Next } from 'hono';

export default async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const traceId = c.get('traceId') ?? '-';
  console.log(`[${c.req.method}] ${c.req.path} ${c.res.status} (${ms}ms) traceId=${traceId}`);
}
