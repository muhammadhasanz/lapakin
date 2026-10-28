import { describe, expect, it } from 'vitest';
import { app, loginAsAdmin } from './setup.ts';

describe('Customers Integration Tests', () => {
  it('should list customers with pagination', async () => {
    const token = await loginAsAdmin();
    const res = await app.app.request('/api/customers?page=1&per_page=5', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta.page).toBe(1);
    expect(body.meta.per_page).toBe(5);
    expect(body.meta.total).toBeGreaterThanOrEqual(15);
  });

  it('should create a new customer', async () => {
    const token = await loginAsAdmin();
    const res = await app.app.request('/api/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_name: 'Budi Test Otomatis',
        customer_address: 'Jl. Merdeka No. 100, Jakarta',
        gender: 'Pria',
        birth_date: '1995-10-25',
        phone: '081299998888',
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.customer_name).toBe('Budi Test Otomatis');
    expect(body.data.gender).toBe('Pria');
  });

  it('should return 422 when gender or birth date format is invalid', async () => {
    const token = await loginAsAdmin();
    const res = await app.app.request('/api/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_name: 'Invalid Customer',
        customer_address: 'Alamat',
        gender: 'Unknown', // Bukan Pria/Wanita
        birth_date: '25-10-1995', // Bukan YYYY-MM-DD
      }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.errors).toBeDefined();
    expect(body.errors.gender).toBeDefined();
    expect(body.errors.birth_date).toBeDefined();
  });
});
