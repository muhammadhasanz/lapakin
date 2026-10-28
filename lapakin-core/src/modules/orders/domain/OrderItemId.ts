import { Identifier } from '@/shared/index.ts';

export class OrderItemId extends Identifier<number> {
  constructor(id: number) {
    super(id);
  }
}
