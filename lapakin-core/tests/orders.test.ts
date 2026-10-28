import { describe, expect, it } from 'vitest';
import { app, loginAsAdmin } from './setup.ts';

describe('Orders Integration Tests', () => {
  it('should create an order successfully, reduce stock, and generate order_number INV-YYYYMMDD-XXXX', async () => {
    const token = await loginAsAdmin();

    // 1. Ambil customer valid
    const custRes = await app.app.request('/api/customers?page=1&per_page=1', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const custBody = (await custRes.json()) as any;
    const customerId = custBody.data[0].id;

    // 2. Buat produk khusus untuk tes order
    const pCode = `P_${Date.now().toString().slice(-8)}`;
    const pRes = await app.app.request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_code: pCode,
        product_name: 'Buku Catatan A5',
        stock: 10,
        price: 25000,
      }),
    });
    const pBody = (await pRes.json()) as any;
    const productId = pBody.data.id;

    // 3. Buat order dengan qty 3
    const orderRes = await app.app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: 3 }],
      }),
    });

    expect(orderRes.status).toBe(201);
    const orderBody = (await orderRes.json()) as any;
    expect(orderBody.success).toBe(true);
    expect(orderBody.data.order_number).toMatch(/^INV-\d{8}-\d{4}$/);
    expect(orderBody.data.total_amount).toBe(75000);
    expect(orderBody.data.items).toHaveLength(1);
    expect(orderBody.data.items[0].unit_price).toBe(25000);
    expect(orderBody.data.items[0].subtotal).toBe(75000);

    // 4. Verifikasi stok produk berkurang dari 10 menjadi 7
    const checkProductRes = await app.app.request(`/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkProductBody = (await checkProductRes.json()) as any;
    expect(checkProductBody.data.stock).toBe(7);
  });

  it('should reject the order when stock is insufficient and roll back the whole transaction (stock unchanged)', async () => {
    const token = await loginAsAdmin();

    const custRes = await app.app.request('/api/customers?page=1&per_page=1', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const custBody = (await custRes.json()) as any;
    const customerId = custBody.data[0].id;

    // Buat 2 produk: p1 stok 10, p2 stok 2
    const p1Code = `P1_${Date.now().toString().slice(-8)}`;
    const p2Code = `P2_${(Date.now() + 1).toString().slice(-8)}`;

    const p1Res = await app.app.request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_code: p1Code,
        product_name: 'Produk Cukup',
        stock: 10,
        price: 10000,
      }),
    });
    const p1Id = ((await p1Res.json()) as any).data.id;

    const p2Res = await app.app.request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_code: p2Code,
        product_name: 'Produk Terbatas',
        stock: 2,
        price: 20000,
      }),
    });
    const p2Id = ((await p2Res.json()) as any).data.id;

    // Order p1 qty 2 (cukup), tapi p2 qty 5 (kurang)
    const failOrderRes = await app.app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: customerId,
        items: [
          { product_id: p1Id, quantity: 2 },
          { product_id: p2Id, quantity: 5 },
        ],
      }),
    });

    expect(failOrderRes.status).toBe(422);
    const failBody = (await failOrderRes.json()) as any;
    expect(failBody.success).toBe(false);
    expect(failBody.message).toBe('Insufficient stock');
    expect(failBody.errors).toBeDefined();
    expect(failBody.errors['items.1.quantity']).toBeDefined();

    // Verifikasi stok p1 TIDAK terpotong (harus tetap 10)
    const checkP1 = await app.app.request(`/api/products/${p1Id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(((await checkP1.json()) as any).data.stock).toBe(10);
  });

  it('should return 422 when the order request format is invalid', async () => {
    const token = await loginAsAdmin();

    const res = await app.app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: 'bukan-uuid',
        items: [], // Kosong
      }),
    });

    expect(res.status).toBe(422);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.errors).toBeDefined();
    expect(body.errors.customer_id).toBeDefined();
    expect(body.errors.items).toBeDefined();
  });

  it('should still show soft-deleted products in historical order details', async () => {
    const token = await loginAsAdmin();

    const custRes = await app.app.request('/api/customers?page=1&per_page=1', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const customerId = ((await custRes.json()) as any).data[0].id;

    // Buat produk
    const pRes = await app.app.request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_code: `H_${Date.now().toString().slice(-8)}`,
        product_name: 'Produk Akan Dihapus',
        stock: 5,
        price: 50000,
      }),
    });
    const productId = ((await pRes.json()) as any).data.id;

    // Buat order
    const orderRes = await app.app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: 1 }],
      }),
    });
    const orderId = ((await orderRes.json()) as any).data.id;

    // Hapus produk (soft delete)
    await app.app.request(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    // Detail order harus tetap menampilkan nama dan unit_price produk
    const detailOrderRes = await app.app.request(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(detailOrderRes.status).toBe(200);
    const detailBody = (await detailOrderRes.json()) as any;
    expect(detailBody.data.items[0].product_name).toBe('Produk Akan Dihapus');
    expect(detailBody.data.items[0].unit_price).toBe(50000);
  });
});
