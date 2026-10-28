import type { Context } from 'hono';
import { Container, Controller, Service } from '@/shared/index.ts';
import Me from './Me.ts';

@Service()
export default class MeController extends Controller {
  constructor(private me: Me = Container.get(Me)) {
    super();
  }

  registerRoutes(): void {
    this.router.get('/auth/me', this.show.bind(this));
  }

  async show(c: Context) {
    const user = c.get('user');
    const result = await this.me.execute(user.id);
    return this.ok(c, result);
  }
}
