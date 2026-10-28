import type { Context } from 'hono';
import { BadRequestError, Container, Controller, Service } from '@/shared/index.ts';
import { OrderMapper } from '../../mappers/OrderMapper.ts';
import ShowOrder from './ShowOrder.ts';

@Service()
export default class ShowOrderController extends Controller {
  constructor(private showOrder: ShowOrder = Container.get(ShowOrder)) {
    super();
  }

  registerRoutes(): void {
    this.router.get('/orders/:id', this.show.bind(this));
  }

  async show(c: Context) {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid order ID');
    }
    const order = await this.showOrder.execute(id);
    return this.ok(c, OrderMapper.toDTO(order));
  }
}
