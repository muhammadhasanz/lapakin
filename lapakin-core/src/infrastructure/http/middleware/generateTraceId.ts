import { randomUUID } from 'node:crypto';
import type { Context, Next } from 'hono';

export default async function generateTraceId(c: Context, next: Next) {
  const traceId = c.req.header('x-trace-id') || randomUUID();
  c.set('traceId', traceId);
  c.header('X-Trace-Id', traceId);
  return next();
}
