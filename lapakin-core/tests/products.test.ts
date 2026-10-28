import { describe, expect, it } from 'vitest';
import { app, loginAsAdmin } from './setup.ts';

describe('Products Integration Tests', () => {
  it('should list products with pagination and meta', async () => {
    const token = await loginAsAdmin();
    const res = await app.app.request('/api/products?page=1&per_page=5', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.meta.page).toBe(1);
    expect(body.meta.per_page).toBe(5);
    expect(body.meta.total).toBeGreaterThanOrEqual(20);
  });

  it('should create a new product', async () => {
    const token = await loginAsAdmin();
    const uniqueCode = `TEST_${Date.now()}`;
    const res = await app.app.request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_code: uniqueCode,
        product_name: 'Produk Uji Coba Otomatis',
        stock: 25,
        price: 15000,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.product_code).toBe(uniqueCode);
    expect(body.data.stock).toBe(25);
    expect(body.data.price).toBe(15000);
  });

  it('should reject product creation when product_code is duplicated (409)', async () => {
    const token = await loginAsAdmin();
    const res = await app.app.request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_code: 'P0001', // Sudah ada dari seeder
        product_name: 'Hydrococo Duplikat',
        stock: 10,
        price: 12000,
      }),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.message).toContain('Product code is already in use');
  });

  it('should return 422 when price or stock input is invalid', async () => {
    const token = await loginAsAdmin();
    const res = await app.app.request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_code: 'P_INVALID',
        product_name: 'Produk Invalid',
        stock: -5, // Stok negatif tidak diperbolehkan
        price: -1000, // Harga <= 0 tidak diperbolehkan
      }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.errors).toBeDefined();
    expect(body.errors.stock).toBeDefined();
    expect(body.errors.price).toBeDefined();
  });

  it('should soft delete a product and hide it from later queries', async () => {
    const token = await loginAsAdmin();
    const uniqueCode = `DEL_${Date.now()}`;
    const createRes = await app.app.request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_code: uniqueCode,
        product_name: 'Produk Untuk Dihapus',
        stock: 10,
        price: 5000,
      }),
    });
    const createdBody = (await createRes.json()) as any;
    const productId = createdBody.data.id;

    // Soft delete
    const deleteRes = await app.app.request(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.status).toBe(204);

    // Ambil lagi: harus 404
    const getRes = await app.app.request(`/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.status).toBe(404);
  });
});
