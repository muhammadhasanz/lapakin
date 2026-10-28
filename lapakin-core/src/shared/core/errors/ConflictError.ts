import { AppError } from './AppError.ts';

export class ConflictError extends AppError {
  constructor(message = 'Conflict', errors?: Record<string, string[]>) {
    super(message, 409, errors);
  }
}
