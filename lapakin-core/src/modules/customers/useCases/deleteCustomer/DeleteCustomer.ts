import { Container, Service, type UseCase } from '@/shared/index.ts';
import CustomerNotFoundError from '../../domain/CustomerNotFoundError.ts';
import CustomerRepo from '../../repos/CustomerRepo.ts';

@Service()
export default class DeleteCustomer implements UseCase<string, Promise<void>> {
  constructor(private customerRepo: CustomerRepo = Container.get(CustomerRepo)) {}

  async execute(id: string): Promise<void> {
    const success = await this.customerRepo.destroy(id);
    if (!success) {
      throw new CustomerNotFoundError();
    }
  }
}
