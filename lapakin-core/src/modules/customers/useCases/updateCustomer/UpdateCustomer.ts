import { Container, Service, type UseCase } from '@/shared/index.ts';
import { Customer } from '../../domain/Customer.ts';
import CustomerNotFoundError from '../../domain/CustomerNotFoundError.ts';
import CustomerRepo from '../../repos/CustomerRepo.ts';
import type UpdateCustomerDTO from './UpdateCustomerDTO.ts';

export interface UpdateCustomerRequest {
  id: string;
  dto: UpdateCustomerDTO;
}

@Service()
export default class UpdateCustomer implements UseCase<UpdateCustomerRequest, Promise<Customer>> {
  constructor(private customerRepo: CustomerRepo = Container.get(CustomerRepo)) {}

  async execute(req: UpdateCustomerRequest): Promise<Customer> {
    const existing = await this.customerRepo.show(req.id);
    if (!existing) {
      throw new CustomerNotFoundError();
    }

    const updatedEntity = Customer.create({
      customerName: req.dto.customer_name.trim(),
      customerAddress: req.dto.customer_address.trim(),
      gender: req.dto.gender,
      birthDate: req.dto.birth_date,
      phone: req.dto.phone ? req.dto.phone.trim() : null,
    });

    const result = await this.customerRepo.update(req.id, updatedEntity);
    if (!result) {
      throw new CustomerNotFoundError();
    }
    return result;
  }
}
