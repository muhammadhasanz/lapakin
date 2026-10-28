import { NotFoundError } from '@/shared/index.ts';

export default class OrderNotFoundError extends NotFoundError {
  constructor(message = 'Order not found') {
    super(message);
  }
}
