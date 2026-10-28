import argon2 from 'argon2';
import config from '@/config/index.ts';
import { centsToDecimal, toCents } from '@/shared/index.ts';
import { db, pool } from './drizzle/index.ts';
import {
  customers,
  orderCounters,
  orderItems,
  orders,
  products,
  refreshTokens,
  users,
} from './drizzle/schema.ts';

// SEED_IF_EMPTY=1 (dipakai docker compose): seed hanya saat DB kosong, restart tidak menghapus data.
if (process.env.SEED_IF_EMPTY && (await db.select({ id: users.id }).from(users).limit(1)).length) {
  console.log('[Seed] Data already present, skipping.');
  await pool.end();
  process.exit(0);
}

console.log('[Seed] Starting database seeding...');

// 1. Clean tables in relational dependency order
await db.delete(orderItems);
await db.delete(orders);
await db.delete(orderCounters);
await db.delete(refreshTokens);
await db.delete(products);
await db.delete(customers);
await db.delete(users);

// 2. Seed Admin User
const hashedPassword = await argon2.hash(config.app.seedAdminPassword);
const [admin] = await db
  .insert(users)
  .values({
    name: 'Admin Lapakin',
    email: config.app.seedAdminEmail,
    password: hashedPassword,
  })
  .returning();
console.log(`[Seed] 1 Admin user created: ${admin!.email}`);

// 3. Seed 25 Products (minimum 20 according to technical test specification)
const productSeeds = [
  { productCode: 'P0001', productName: 'Hydrococo 150ml', stock: 150, price: '12000.00' },
  { productCode: 'P0002', productName: 'Indomie Goreng Original', stock: 500, price: '3500.00' },
  { productCode: 'P0003', productName: 'Ultra Milk Coklat 250ml', stock: 120, price: '7500.00' },
  { productCode: 'P0004', productName: 'Teh Botol Sosro 330ml', stock: 100, price: '4500.00' },
  { productCode: 'P0005', productName: 'Pocari Sweat 500ml', stock: 4, price: '9000.00' }, // stock < 5
  { productCode: 'P0006', productName: 'Chitato Sapi Panggang 68g', stock: 3, price: '11500.00' }, // stock < 5
  { productCode: 'P0007', productName: 'Aqua Air Mineral 600ml', stock: 300, price: '4000.00' },
  { productCode: 'P0008', productName: 'Bango Kecap Manis 550ml', stock: 80, price: '24000.00' },
  { productCode: 'P0009', productName: 'Minyak Goreng Bimoli 2L', stock: 60, price: '38000.00' },
  { productCode: 'P0010', productName: 'Beras Pandan Wangi 5kg', stock: 45, price: '78000.00' },
  {
    productCode: 'P0011',
    productName: 'Kopi Kapal Api Special 165g',
    stock: 90,
    price: '15500.00',
  },
  { productCode: 'P0012', productName: 'Gula Pasir Gulaku 1kg', stock: 110, price: '17500.00' },
  { productCode: 'P0013', productName: 'Silverqueen Almond 62g', stock: 75, price: '16000.00' },
  { productCode: 'P0014', productName: 'Oreo Vanila 133g', stock: 85, price: '9500.00' },
  { productCode: 'P0015', productName: 'Sedaap Mie Kuah Soto', stock: 350, price: '3200.00' },
  { productCode: 'P0016', productName: 'Nescafe Classic 100g', stock: 50, price: '32000.00' },
  { productCode: 'P0017', productName: 'Nutrisari Jeruk Manis 10s', stock: 140, price: '14000.00' },
  {
    productCode: 'P0018',
    productName: 'Yakult Minuman Probiotik 5s',
    stock: 95,
    price: '11000.00',
  },
  { productCode: 'P0019', productName: 'Pringles Original 107g', stock: 2, price: '26000.00' }, // stok < 5
  { productCode: 'P0020', productName: 'Taro Net Seaweed 65g', stock: 65, price: '8500.00' },
  { productCode: 'P0021', productName: 'Buavita Jambu 250ml', stock: 70, price: '8000.00' },
  { productCode: 'P0022', productName: 'Beng Beng Maxx 32g', stock: 180, price: '4000.00' },
  { productCode: 'P0023', productName: 'Tango Wafer Coklat 130g', stock: 90, price: '9000.00' },
  { productCode: 'P0024', productName: 'Roma Sari Gandum 115g', stock: 80, price: '8500.00' },
  { productCode: 'P0025', productName: 'Sunlight Jeruk Nipis 750ml', stock: 55, price: '16500.00' },
];

const insertedProducts = await db.insert(products).values(productSeeds).returning();
console.log(`[Seed] ${insertedProducts.length} Products created`);

// 4. Seed 15 Customers
const customerSeeds = [
  {
    customerName: 'Budi Santoso',
    customerAddress: 'Jl. Sudirman No. 45, Jakarta Selatan',
    gender: 'Pria' as const,
    birthDate: '1990-05-14',
    phone: '081234567890',
  },
  {
    customerName: 'Siti Rahmawati',
    customerAddress: 'Jl. Malioboro No. 12, Yogyakarta',
    gender: 'Wanita' as const,
    birthDate: '1994-08-22',
    phone: '081398765432',
  },
  {
    customerName: 'Ahmad Fauzi',
    customerAddress: 'Jl. Diponegoro No. 88, Surabaya',
    gender: 'Pria' as const,
    birthDate: '1988-11-03',
    phone: '085712349876',
  },
  {
    customerName: 'Dewi Lestari',
    customerAddress: 'Jl. Dago No. 102, Bandung',
    gender: 'Wanita' as const,
    birthDate: '1996-03-30',
    phone: '087855443322',
  },
  {
    customerName: 'Eko Prasetyo',
    customerAddress: 'Jl. Pemuda No. 15, Semarang',
    gender: 'Pria' as const,
    birthDate: '1992-07-19',
    phone: '082199887766',
  },
  {
    customerName: 'Rina Kurniawati',
    customerAddress: 'Jl. Gajah Mada No. 64, Denpasar',
    gender: 'Wanita' as const,
    birthDate: '1995-12-05',
    phone: '081277665544',
  },
  {
    customerName: 'Bambang Wijaya',
    customerAddress: 'Jl. Urip Sumoharjo No. 31, Solo',
    gender: 'Pria' as const,
    birthDate: '1985-01-25',
    phone: '085644332211',
  },
  {
    customerName: 'Mega Pratiwi',
    customerAddress: 'Jl. Ahmad Yani No. 50, Malang',
    gender: 'Wanita' as const,
    birthDate: '1998-09-17',
    phone: '081388776655',
  },
  {
    customerName: 'Hendra Setiawan',
    customerAddress: 'Jl. Veteran No. 23, Medan',
    gender: 'Pria' as const,
    birthDate: '1991-04-08',
    phone: '082366554433',
  },
  {
    customerName: 'Nurul Hidayah',
    customerAddress: 'Jl. Pahlawan No. 7, Palembang',
    gender: 'Wanita' as const,
    birthDate: '1993-06-11',
    phone: '087711223344',
  },
  {
    customerName: 'Agus Gunawan',
    customerAddress: 'Jl. Basuki Rahmat No. 9, Makassar',
    gender: 'Pria' as const,
    birthDate: '1987-10-28',
    phone: '081233445566',
  },
  {
    customerName: 'Fitri Handayani',
    customerAddress: 'Jl. Cendrawasih No. 18, Balikpapan',
    gender: 'Wanita' as const,
    birthDate: '1997-02-14',
    phone: '085288990011',
  },
  {
    customerName: 'Reza Pratama',
    customerAddress: 'Jl. KH Ahmad Dahlan No. 3, Padang',
    gender: 'Pria' as const,
    birthDate: '1999-08-01',
    phone: '089677889900',
  },
  {
    customerName: 'Yuni Astuti',
    customerAddress: 'Jl. Hayam Wuruk No. 72, Jember',
    gender: 'Wanita' as const,
    birthDate: '1992-04-20',
    phone: '081344556677',
  },
  {
    customerName: 'Dimas Anggara',
    customerAddress: 'Jl. Teuku Umar No. 11, Bandar Lampung',
    gender: 'Pria' as const,
    birthDate: '1994-10-09',
    phone: '085811223344',
  },
];

const insertedCustomers = await db.insert(customers).values(customerSeeds).returning();
console.log(`[Seed] ${insertedCustomers.length} Customers created`);

// 5. Seed 30 Orders distributed across the last 30 days
const now = Date.now();
const oneDayMs = 86_400_000;
const dayCounters = new Map<string, number>();

for (let i = 0; i < 30; i++) {
  const daysAgo = 29 - i;
  // Step back from now; hours vary but never exceed the current time
  const orderDate = new Date(now - daysAgo * oneDayMs - ((i * 3600_000) % oneDayMs));
  const customer = insertedCustomers[i % insertedCustomers.length]!;

  const numItems = (i % 3) + 1;
  const chosenProducts = [
    insertedProducts[(i * 2) % insertedProducts.length]!,
    insertedProducts[(i * 3 + 1) % insertedProducts.length]!,
    insertedProducts[(i * 5 + 2) % insertedProducts.length]!,
  ].slice(0, numItems);

  const y = orderDate.getFullYear();
  const m = String(orderDate.getMonth() + 1).padStart(2, '0');
  const d = String(orderDate.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;
  // Per-day sequence, same as OrderCounterRepo: INV-YYYYMMDD-XXXX
  const seq = (dayCounters.get(dateStr) ?? 0) + 1;
  dayCounters.set(dateStr, seq);
  const orderNumber = `INV-${dateStr}-${String(seq).padStart(4, '0')}`;

  let totalCents = 0;
  const orderItemsData = chosenProducts.map((prod, pIdx) => {
    const qty = ((i + pIdx) % 3) + 1;
    const unitPriceCents = toCents(prod.price);
    const subtotalCents = unitPriceCents * qty;
    totalCents += subtotalCents;

    return {
      productId: prod.id,
      quantity: qty,
      unitPrice: prod.price,
      subtotal: centsToDecimal(subtotalCents),
    };
  });

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      customerId: customer.id,
      createdBy: admin!.id,
      orderDate,
      totalAmount: centsToDecimal(totalCents),
    })
    .returning();

  await db.insert(orderItems).values(
    orderItemsData.map((item) => ({
      orderId: order!.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
  );
}

// Advance the daily counters so new orders continue after the seeded sequence
// (otherwise the first order of the day collides with INV-YYYYMMDD-0001)
await db.insert(orderCounters).values(
  [...dayCounters.entries()].map(([dateStr, lastSeq]) => ({
    day: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
    lastSeq,
  })),
);

console.log('[Seed] 30 Orders created across 30 days');
console.log('[Seed] Database seeding completed!');
await pool.end();
