import { sql } from 'drizzle-orm';
import type { Transaction } from '@/infrastructure/database/drizzle/index.ts';
import { orderCounters } from '@/infrastructure/database/drizzle/schema.ts';
import { Service } from '@/shared/index.ts';

@Service()
export default class OrderCounterRepo {
  async getNextOrderNumber(tx: Transaction, date: Date = new Date()): Promise<string> {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dayStr = `${y}-${m}-${d}`;
    const dateCompact = `${y}${m}${d}`;

    const [row] = await tx
      .insert(orderCounters)
      .values({ day: dayStr, lastSeq: 1 })
      .onConflictDoUpdate({
        target: orderCounters.day,
        set: { lastSeq: sql`${orderCounters.lastSeq} + 1` },
      })
      .returning({ lastSeq: orderCounters.lastSeq });

    const seqStr = String(row!.lastSeq).padStart(4, '0');
    return `INV-${dateCompact}-${seqStr}`;
  }
}
