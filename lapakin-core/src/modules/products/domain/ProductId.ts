import { Identifier } from '@/shared/index.ts';

export class ProductId extends Identifier<number> {
  constructor(id: number) {
    super(id);
  }
}
