import { Container, Service, type UseCase } from '@/shared/index.ts';
import type { Customer } from '../../domain/Customer.ts';
import CustomerNotFoundError from '../../domain/CustomerNotFoundError.ts';
import CustomerRepo from '../../repos/CustomerRepo.ts';

@Service()
export default class ShowCustomer implements UseCase<string, Promise<Customer>> {
  constructor(private customerRepo: CustomerRepo = Container.get(CustomerRepo)) {}

  async execute(id: string): Promise<Customer> {
    const customer = await this.customerRepo.show(id);
    if (!customer) {
      throw new CustomerNotFoundError();
    }
    return customer;
  }
}
