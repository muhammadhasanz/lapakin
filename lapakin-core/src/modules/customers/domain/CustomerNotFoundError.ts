import { NotFoundError } from '@/shared/index.ts';

export default class CustomerNotFoundError extends NotFoundError {
  constructor(message = 'Customer not found') {
    super(message);
  }
}
