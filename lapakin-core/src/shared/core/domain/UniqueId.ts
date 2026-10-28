import { randomUUID } from 'node:crypto';
import { Identifier } from './Identifier.ts';

export class UniqueId extends Identifier<string> {
  constructor(id?: string) {
    super(id ?? randomUUID());
  }
}
