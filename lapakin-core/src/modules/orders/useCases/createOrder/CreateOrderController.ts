import type { Context } from 'hono';
import { Container, Controller, Service, transformAndValidate } from '@/shared/index.ts';
import { OrderMapper } from '../../mappers/OrderMapper.ts';
import CreateOrder from './CreateOrder.ts';
import CreateOrderDTO from './CreateOrderDTO.ts';

@Service()
export default class CreateOrderController extends Controller {
  constructor(private createOrder: CreateOrder = Container.get(CreateOrder)) {
    super();
  }

  registerRoutes(): void {
    this.router.post('/orders', this.store.bind(this));
  }

  async store(c: Context) {
    const raw = await c.req.json();
    const dto = transformAndValidate(CreateOrderDTO, raw);
    const user = c.get('user');

    const order = await this.createOrder.execute({
      dto,
      userId: user.id,
    });

    return this.created(c, OrderMapper.toDTO(order), 'Order created successfully');
  }
}
