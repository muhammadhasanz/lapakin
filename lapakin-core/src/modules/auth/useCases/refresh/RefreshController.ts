import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import {
  Container,
  Controller,
  REFRESH_TOKEN_COOKIE,
  Service,
  setAuthCookies,
  transformAndValidate,
} from '@/shared/index.ts';
import Refresh from './Refresh.ts';
import RefreshDTO from './RefreshDTO.ts';

@Service()
export default class RefreshController extends Controller {
  constructor(private refresh: Refresh = Container.get(Refresh)) {
    super();
  }

  registerRoutes(): void {
    this.router.post('/auth/refresh', this.store.bind(this));
  }

  async store(c: Context) {
    let raw: Record<string, any> = {};
    try {
      raw = await c.req.json();
    } catch {
      raw = {};
    }

    const cookieToken = getCookie(c, REFRESH_TOKEN_COOKIE);
    const refreshToken = raw.refresh_token || cookieToken;

    const dto = transformAndValidate(RefreshDTO, { refresh_token: refreshToken });
    const result = await this.refresh.execute(dto);
    setAuthCookies(c, result.access_token, result.refresh_token);
    return this.ok(c, result);
  }
}
