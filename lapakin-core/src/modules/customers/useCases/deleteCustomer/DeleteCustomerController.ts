import type { Context } from 'hono';
import { BadRequestError, Container, Controller, Service } from '@/shared/index.ts';
import DeleteCustomer from './DeleteCustomer.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Service()
export default class DeleteCustomerController extends Controller {
  constructor(private deleteCustomer: DeleteCustomer = Container.get(DeleteCustomer)) {
    super();
  }

  registerRoutes(): void {
    this.router.delete('/customers/:id', this.destroy.bind(this));
  }

  async destroy(c: Context) {
    const id = c.req.param('id') ?? '';
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError('Invalid customer ID');
    }
    await this.deleteCustomer.execute(id);
    return this.noContent(c);
  }
}
