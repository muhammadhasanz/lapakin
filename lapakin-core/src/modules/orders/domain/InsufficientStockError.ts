import { AppError } from '@/shared/index.ts';

export default class InsufficientStockError extends AppError {
  constructor(errors: Record<string, string[]>, message = 'Insufficient stock') {
    super(message, 422, errors);
  }
}
