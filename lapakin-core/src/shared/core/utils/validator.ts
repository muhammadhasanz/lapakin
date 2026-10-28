import { type ClassConstructor, plainToInstance } from 'class-transformer';
import { type ValidatorOptions, validateSync } from 'class-validator';
import { RequestValidationError } from '../errors/RequestValidationError.ts';

export function transformAndValidate<T extends object>(
  targetClass: ClassConstructor<T>,
  raw: unknown,
  options?: ValidatorOptions,
): T {
  const instance = plainToInstance(targetClass, raw ?? {}, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(instance, {
    whitelist: true,
    forbidNonWhitelisted: false,
    ...options,
  });

  if (errors.length > 0) {
    throw new RequestValidationError(errors, 'Validation failed');
  }

  return instance;
}

export default transformAndValidate;
