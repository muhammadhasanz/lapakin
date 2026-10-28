import { Container, Service, type UseCase } from '@/shared/index.ts';
import type { Order } from '../../domain/Order.ts';
import OrderRepo from '../../repos/OrderRepo.ts';
import type CreateOrderDTO from './CreateOrderDTO.ts';

export interface CreateOrderRequest {
  dto: CreateOrderDTO;
  userId: string;
}

@Service()
export default class CreateOrder implements UseCase<CreateOrderRequest, Promise<Order>> {
  constructor(private orderRepo: OrderRepo = Container.get(OrderRepo)) {}

  async execute(req: CreateOrderRequest): Promise<Order> {
    return this.orderRepo.createOrderWithItems({
      customerId: req.dto.customer_id,
      createdBy: req.userId,
      items: req.dto.items.map((i) => ({
        productId: i.product_id,
        quantity: i.quantity,
      })),
    });
  }
}
