import type { ValidationError } from 'class-validator';
import { AppError } from './AppError.ts';

export class RequestValidationError extends AppError {
  public validationErrors: ValidationError[];

  constructor(errors: ValidationError[], message = 'Validation failed') {
    const formattedErrors = RequestValidationError.formatErrors(errors);
    super(message, 422, formattedErrors);
    this.validationErrors = errors;
  }

  public static formatErrors(errors: ValidationError[], parentPath = ''): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const error of errors) {
      const currentPath = parentPath ? `${parentPath}.${error.property}` : error.property;

      if (error.constraints && Object.keys(error.constraints).length > 0) {
        result[currentPath] = Object.values(error.constraints);
      }

      if (error.children && error.children.length > 0) {
        const childErrors = RequestValidationError.formatErrors(error.children, currentPath);
        for (const [key, messages] of Object.entries(childErrors)) {
          result[key] = messages;
        }
      }
    }

    return result;
  }
}
