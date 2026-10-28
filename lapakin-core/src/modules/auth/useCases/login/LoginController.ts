import type { Context } from 'hono';
import {
  Container,
  Controller,
  Service,
  setAuthCookies,
  transformAndValidate,
} from '@/shared/index.ts';
import Login from './Login.ts';
import LoginDTO from './LoginDTO.ts';

@Service()
export default class LoginController extends Controller {
  constructor(private login: Login = Container.get(Login)) {
    super();
  }

  registerRoutes(): void {
    this.router.post('/auth/login', this.store.bind(this));
  }

  async store(c: Context) {
    const raw = await c.req.json();
    const dto = transformAndValidate(LoginDTO, raw);
    const result = await this.login.execute(dto);
    setAuthCookies(c, result.access_token, result.refresh_token);
    return this.ok(c, result, 'Login successful');
  }
}
