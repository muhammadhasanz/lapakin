import { buildMeta, Container, type PageMeta, Service, type UseCase } from '@/shared/index.ts';
import { CustomerMapper } from '../../mappers/CustomerMapper.ts';
import CustomerRepo from '../../repos/CustomerRepo.ts';
import type ListCustomerDTO from './ListCustomerDTO.ts';

export interface ListCustomerResponse {
  data: any[];
  meta: PageMeta;
}

@Service()
export default class ListCustomer
  implements UseCase<ListCustomerDTO, Promise<ListCustomerResponse>>
{
  constructor(private customerRepo: CustomerRepo = Container.get(CustomerRepo)) {}

  async execute(req: ListCustomerDTO): Promise<ListCustomerResponse> {
    const result = await this.customerRepo.list({
      page: req.page,
      per_page: req.per_page,
      search: req.search,
    });

    const meta = buildMeta(req.page, req.per_page, result.total);
    return {
      data: result.docs.map(CustomerMapper.toDTO),
      meta,
    };
  }
}
