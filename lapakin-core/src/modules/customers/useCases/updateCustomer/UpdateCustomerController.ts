import type { Context } from 'hono';
import {
  BadRequestError,
  Container,
  Controller,
  Service,
  transformAndValidate,
} from '@/shared/index.ts';
import { CustomerMapper } from '../../mappers/CustomerMapper.ts';
import UpdateCustomer from './UpdateCustomer.ts';
import UpdateCustomerDTO from './UpdateCustomerDTO.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Service()
export default class UpdateCustomerController extends Controller {
  constructor(private updateCustomer: UpdateCustomer = Container.get(UpdateCustomer)) {
    super();
  }

  registerRoutes(): void {
    this.router.put('/customers/:id', this.update.bind(this));
  }

  async update(c: Context) {
    const id = c.req.param('id') ?? '';
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError('Invalid customer ID');
    }
    const raw = await c.req.json();
    const dto = transformAndValidate(UpdateCustomerDTO, raw);
    const customer = await this.updateCustomer.execute({ id, dto });
    return this.ok(c, CustomerMapper.toDTO(customer), 'Customer updated successfully');
  }
}
