import { type Context, Hono } from 'hono';
import { AppError } from '../errors/AppError.ts';
import type { PageMeta } from '../utils/response.ts';

export abstract class Controller {
  public router: Hono = new Hono();

  constructor() {
    this.registerRoutes();
  }

  abstract registerRoutes(): void;

  public ok(c: Context, dto?: unknown, message = 'OK') {
    if (dto !== undefined && dto !== null) {
      return c.json({ success: true as const, message, data: dto }, 200);
    }
    return c.json({ success: true as const, message }, 200);
  }

  public created(c: Context, dto?: unknown, message = 'Created') {
    return c.json({ success: true as const, message, data: dto }, 201);
  }

  public noContent(c: Context) {
    return c.body(null, 204);
  }

  public paginated(c: Context, docs: unknown[], meta: PageMeta, message = 'OK') {
    return c.json({ success: true as const, message, data: docs, meta }, 200);
  }

  public fail(c: Context, error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new AppError(String(error));
  }
}
