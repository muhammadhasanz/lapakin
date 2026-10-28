import type { Context } from 'hono';
import { Container, Controller, clearAuthCookies, Service } from '@/shared/index.ts';
import Logout from './Logout.ts';

@Service()
export default class LogoutController extends Controller {
  constructor(private logout: Logout = Container.get(Logout)) {
    super();
  }

  registerRoutes(): void {
    this.router.post('/auth/logout', this.store.bind(this));
  }

  async store(c: Context) {
    const sessionId = c.get('sessionId');
    if (sessionId) {
      await this.logout.execute(sessionId);
    }
    clearAuthCookies(c);
    return this.ok(c, null, 'Logout successful');
  }
}
