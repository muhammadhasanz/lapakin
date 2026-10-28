import { Container, Service, type UseCase } from '@/shared/index.ts';
import type { Order } from '../../domain/Order.ts';
import OrderNotFoundError from '../../domain/OrderNotFoundError.ts';
import OrderRepo from '../../repos/OrderRepo.ts';

@Service()
export default class ShowOrder implements UseCase<number, Promise<Order>> {
  constructor(private orderRepo: OrderRepo = Container.get(OrderRepo)) {}

  async execute(id: number): Promise<Order> {
    const order = await this.orderRepo.show(id);
    if (!order) {
      throw new OrderNotFoundError();
    }
    return order;
  }
}
