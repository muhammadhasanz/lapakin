import type { Context } from 'hono';
import { Container, Controller, Service, transformAndValidate } from '@/shared/index.ts';
import { CustomerMapper } from '../../mappers/CustomerMapper.ts';
import CreateCustomer from './CreateCustomer.ts';
import CreateCustomerDTO from './CreateCustomerDTO.ts';

@Service()
export default class CreateCustomerController extends Controller {
  constructor(private createCustomer: CreateCustomer = Container.get(CreateCustomer)) {
    super();
  }

  registerRoutes(): void {
    this.router.post('/customers', this.store.bind(this));
  }

  async store(c: Context) {
    const raw = await c.req.json();
    const dto = transformAndValidate(CreateCustomerDTO, raw);
    const customer = await this.createCustomer.execute(dto);
    return this.created(c, CustomerMapper.toDTO(customer), 'Customer created successfully');
  }
}
