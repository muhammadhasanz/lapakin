import { describe, expect, it } from 'vitest';
import { app, loginAsAdmin } from './setup.ts';

describe('Dashboard Integration Tests', () => {
  it('should return a complete dashboard summary with top 5 products and low stock', async () => {
    const token = await loginAsAdmin();
    const res = await app.app.request('/api/dashboard/summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(typeof body.data.total_transactions).toBe('number');
    expect(typeof body.data.total_sales).toBe('number');
    expect(body.data.total_transactions).toBeGreaterThanOrEqual(30);
    expect(body.data.top_products).toBeInstanceOf(Array);
    expect(body.data.top_products.length).toBeLessThanOrEqual(5);
    expect(body.data.low_stock_products).toBeInstanceOf(Array);
  });
});
