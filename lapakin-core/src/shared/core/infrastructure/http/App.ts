import { serve } from '@hono/node-server';
import { type Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { AppError } from '../../errors/AppError.ts';
import { type Constructor, Container } from '../Container.ts';
import { Controller } from '../Controller.ts';

export class App {
  public app: Hono = new Hono();
  protected controllers: (Constructor<Controller> | Controller)[] = [];

  constructor(controllers: (Constructor<Controller> | Controller)[] = []) {
    this.controllers = controllers;
    this.registerMiddleware();
    this.registerControllers(this.controllers);
    this.registerErrorHandlers();
  }

  protected registerMiddleware(): void {
    this.app.use(requestId());
    this.app.use(secureHeaders());
    this.app.use(
      '/api/*',
      cors({
        origin: (origin) => origin || '*',
        credentials: true,
      }),
    );
  }

  protected registerControllers(controllers: (Constructor<Controller> | Controller)[]): void {
    controllers.forEach((controller) => {
      const instance = this.resolve(controller);
      this.app.route('/api', instance.router);
    });
  }

  protected resolve(klass: Constructor<Controller> | Controller): Controller {
    if (klass instanceof Controller) {
      return klass;
    }
    return Container.get(klass);
  }

  protected registerErrorHandlers(): void {
    this.app.notFound((c: Context) => {
      return c.json({ success: false, message: 'Endpoint not found' }, 404);
    });

    this.app.onError((err: Error, c: Context) => {
      if (err instanceof AppError) {
        return c.json(
          {
            success: false,
            message: err.message,
            ...(err.errors && { errors: err.errors }),
          },
          err.status as any,
        );
      }
      if (err instanceof SyntaxError || (err as any).name === 'HTTPException') {
        return c.json({ success: false, message: 'Request body is not valid JSON' }, 400);
      }
      console.error('[App Error]', err);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    });
  }

  public start(port = 3000) {
    return serve({ fetch: this.app.fetch, port }, (info) => {
      console.log(`lapakin-core listening on :${info.port}`);
    });
  }
}
