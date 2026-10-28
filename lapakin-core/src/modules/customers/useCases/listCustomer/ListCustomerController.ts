import type { Context } from 'hono';
import { Container, Controller, Service, transformAndValidate } from '@/shared/index.ts';
import ListCustomer from './ListCustomer.ts';
import ListCustomerDTO from './ListCustomerDTO.ts';

@Service()
export default class ListCustomerController extends Controller {
  constructor(private listCustomer: ListCustomer = Container.get(ListCustomer)) {
    super();
  }

  registerRoutes(): void {
    this.router.get('/customers', this.index.bind(this));
  }

  async index(c: Context) {
    const query = c.req.query();
    const dto = transformAndValidate(ListCustomerDTO, query);
    const result = await this.listCustomer.execute(dto);
    return this.paginated(c, result.data, result.meta);
  }
}
