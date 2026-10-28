import { NotFoundError } from '@/shared/index.ts';

export default class UserNotFoundError extends NotFoundError {
  constructor(message = 'User not found') {
    super(message);
  }
}
