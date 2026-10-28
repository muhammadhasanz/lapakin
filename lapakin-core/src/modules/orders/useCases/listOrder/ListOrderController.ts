import type { Context } from 'hono';
import { Container, Controller, Service, transformAndValidate } from '@/shared/index.ts';
import ListOrder from './ListOrder.ts';
import ListOrderDTO from './ListOrderDTO.ts';

@Service()
export default class ListOrderController extends Controller {
  constructor(private listOrder: ListOrder = Container.get(ListOrder)) {
    super();
  }

  registerRoutes(): void {
    this.router.get('/orders', this.index.bind(this));
  }

  async index(c: Context) {
    const query = c.req.query();
    const dto = transformAndValidate(ListOrderDTO, query);
    const result = await this.listOrder.execute(dto);
    return this.paginated(c, result.data, result.meta);
  }
}
