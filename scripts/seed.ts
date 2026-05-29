import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from 'bcryptjs';
import * as schema from '../src/db/schema';

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });

  console.log('🌱 Seeding database...');

  // Create store settings
  await db.insert(schema.storeSettings).values({
    storeName: 'Studio POS',
    storeSubtitle: 'Point of Sale',
    logoInitial: 'S',
    theme: 'indigo',
  }).onConflictDoNothing();

  console.log('✅ Store settings created');

  // Create users
  const adminPassword = await hash('admin123', 12);
  const cashierPassword = await hash('cashier123', 12);

  await db.insert(schema.users).values([
    { name: 'Admin Studio', email: 'admin@studio.com', password: adminPassword, role: 'SUPERADMIN' },
    { name: 'Kasir 1', email: 'kasir@studio.com', password: cashierPassword, role: 'CASHIER' },
  ]).onConflictDoNothing();

  console.log('✅ Users created');

  // Create categories
  await db.insert(schema.categories).values([
    { name: 'Studio', type: 'STUDIO', sortOrder: 1 },
    { name: 'Minuman', type: 'FB', sortOrder: 2 },
    { name: 'Makanan', type: 'FB', sortOrder: 3 },
    { name: 'Merchandise', type: 'STUDIO', sortOrder: 4 },
  ]).onConflictDoNothing();

  console.log('✅ Categories created');

  // Create sample products
  await db.insert(schema.products).values([
    { categoryId: 1, name: 'Sewa Studio 1 Jam', price: '150000', costPrice: '50000', stock: 99, minStock: 5 },
    { categoryId: 1, name: 'Sewa Studio 2 Jam', price: '250000', costPrice: '80000', stock: 99, minStock: 5 },
    { categoryId: 1, name: 'Sewa Studio 3 Jam', price: '350000', costPrice: '100000', stock: 99, minStock: 5 },
    { categoryId: 2, name: 'Es Teh Manis', price: '8000', costPrice: '3000', stock: 50, minStock: 10 },
    { categoryId: 2, name: 'Kopi Susu', price: '15000', costPrice: '6000', stock: 30, minStock: 10 },
    { categoryId: 2, name: 'Air Mineral', price: '5000', costPrice: '2000', stock: 100, minStock: 20 },
    { categoryId: 3, name: 'Indomie Goreng', price: '12000', costPrice: '5000', stock: 40, minStock: 10 },
    { categoryId: 3, name: 'Roti Bakar', price: '15000', costPrice: '7000', stock: 20, minStock: 5 },
    { categoryId: 4, name: 'Pick Gitar', price: '10000', costPrice: '3000', stock: 50, minStock: 10 },
    { categoryId: 4, name: 'Senar Gitar Set', price: '45000', costPrice: '25000', stock: 15, minStock: 5 },
  ]).onConflictDoNothing();

  console.log('✅ Products created');
  console.log('');
  console.log('📋 Default accounts:');
  console.log('   Admin: admin@studio.com / admin123');
  console.log('   Kasir: kasir@studio.com / cashier123');
  console.log('');
  console.log('🎉 Seeding complete!');

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
