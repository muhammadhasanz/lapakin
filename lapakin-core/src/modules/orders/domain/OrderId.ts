import { Identifier } from '@/shared/index.ts';

export class OrderId extends Identifier<number> {
  constructor(id: number) {
    super(id);
  }
}
