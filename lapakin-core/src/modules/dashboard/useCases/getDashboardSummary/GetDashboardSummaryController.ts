import type { Context } from 'hono';
import { Container, Controller, Service } from '@/shared/index.ts';
import GetDashboardSummary from './GetDashboardSummary.ts';

@Service()
export default class GetDashboardSummaryController extends Controller {
  constructor(
    private getDashboardSummary: GetDashboardSummary = Container.get(GetDashboardSummary),
  ) {
    super();
  }

  registerRoutes(): void {
    this.router.get('/dashboard/summary', this.show.bind(this));
  }

  async show(c: Context) {
    const summary = await this.getDashboardSummary.execute();
    return this.ok(c, summary);
  }
}
