import { AppError } from './AppError.ts';

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errors?: Record<string, string[]>) {
    super(message, 400, errors);
  }
}
