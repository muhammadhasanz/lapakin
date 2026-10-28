import type { Context } from 'hono';
import { BadRequestError, Container, Controller, Service } from '@/shared/index.ts';
import { CustomerMapper } from '../../mappers/CustomerMapper.ts';
import ShowCustomer from './ShowCustomer.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Service()
export default class ShowCustomerController extends Controller {
  constructor(private showCustomer: ShowCustomer = Container.get(ShowCustomer)) {
    super();
  }

  registerRoutes(): void {
    this.router.get('/customers/:id', this.show.bind(this));
  }

  async show(c: Context) {
    const id = c.req.param('id') ?? '';
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError('Invalid customer ID');
    }
    const customer = await this.showCustomer.execute(id);
    return this.ok(c, CustomerMapper.toDTO(customer));
  }
}
