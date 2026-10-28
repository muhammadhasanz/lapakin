import { NotFoundError } from '@/shared/index.ts';

export default class ProductNotFoundError extends NotFoundError {
  constructor(message = 'Product not found') {
    super(message);
  }
}
