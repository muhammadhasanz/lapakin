import { ConflictError } from '@/shared/index.ts';

export default class ProductCodeAlreadyExistsError extends ConflictError {
  constructor(message = 'Product code is already in use') {
    super(message, {
      product_code: ['Product code is already in use (including deleted products)'],
    });
  }
}
