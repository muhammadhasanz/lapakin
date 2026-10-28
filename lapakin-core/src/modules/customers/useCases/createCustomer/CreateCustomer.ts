import { Container, Service, type UseCase } from '@/shared/index.ts';
import { Customer } from '../../domain/Customer.ts';
import CustomerRepo from '../../repos/CustomerRepo.ts';
import type CreateCustomerDTO from './CreateCustomerDTO.ts';

@Service()
export default class CreateCustomer implements UseCase<CreateCustomerDTO, Promise<Customer>> {
  constructor(private customerRepo: CustomerRepo = Container.get(CustomerRepo)) {}

  async execute(req: CreateCustomerDTO): Promise<Customer> {
    const customer = Customer.create({
      customerName: req.customer_name.trim(),
      customerAddress: req.customer_address.trim(),
      gender: req.gender,
      birthDate: req.birth_date,
      phone: req.phone ? req.phone.trim() : null,
    });

    return this.customerRepo.save(customer);
  }
}
