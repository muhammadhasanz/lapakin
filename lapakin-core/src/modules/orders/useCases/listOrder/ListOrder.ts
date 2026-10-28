import { buildMeta, Container, type PageMeta, Service, type UseCase } from '@/shared/index.ts';
import { OrderMapper } from '../../mappers/OrderMapper.ts';
import OrderRepo from '../../repos/OrderRepo.ts';
import type ListOrderDTO from './ListOrderDTO.ts';

export interface ListOrderResponse {
  data: any[];
  meta: PageMeta;
}

@Service()
export default class ListOrder implements UseCase<ListOrderDTO, Promise<ListOrderResponse>> {
  constructor(private orderRepo: OrderRepo = Container.get(OrderRepo)) {}

  async execute(req: ListOrderDTO): Promise<ListOrderResponse> {
    const result = await this.orderRepo.list({
      page: req.page,
      per_page: req.per_page,
      from: req.from,
      to: req.to,
      customer_id: req.customer_id,
    });

    const meta = buildMeta(req.page, req.per_page, result.total);
    return {
      data: result.docs.map(OrderMapper.toListItemDTO),
      meta,
    };
  }
}
