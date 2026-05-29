'use server';

import { db } from '@/db';
import { products, categories, stockAdjustments, auditLogs } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAdmin, requireAuth } from '@/lib/auth';

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProducts(opts?: { includeArchived?: boolean }) {
  await requireAdmin();

  const conditions = opts?.includeArchived ? undefined : eq(products.isArchived, false);

  return db.query.products.findMany({
    where: conditions,
    with: { category: true },
    orderBy: [desc(products.updatedAt)],
  });
}

export async function addProduct(payload: {
  categoryId: number;
  name: string;
  price: number;
  costPrice?: number;
  stock?: number;
  sku?: string;
  isMenuItem?: boolean;
  minStock?: number;
}) {
  const session = await requireAdmin();

  if (!payload.name?.trim()) {
    return { error: 'Nama produk wajib diisi.' };
  }
  if (payload.price <= 0) {
    return { error: 'Harga harus lebih dari 0.' };
  }

  try {
    const [product] = await db.insert(products).values({
      categoryId: payload.categoryId,
      name: payload.name.trim(),
      price: payload.price.toString(),
      costPrice: (payload.costPrice || 0).toString(),
      stock: payload.stock ?? 0,
      sku: payload.sku?.trim() || null,
      isMenuItem: payload.isMenuItem ?? true,
      minStock: payload.minStock ?? 0,
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'CREATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: product.id,
      detail: JSON.stringify(product),
    });

    return { success: true, product };
  } catch (error: any) {
    console.error('Add product error:', error);
    return { error: error.message || 'Gagal menambah produk.' };
  }
}

export async function updateProduct(id: number, payload: {
  name?: string;
  price?: number;
  costPrice?: number;
  sku?: string;
  categoryId?: number;
  isMenuItem?: boolean;
  minStock?: number;
}) {
  const session = await requireAdmin();

  const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!existing) {
    return { error: 'Produk tidak ditemukan.' };
  }

  try {
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (payload.name !== undefined) updates.name = payload.name.trim();
    if (payload.price !== undefined) updates.price = payload.price.toString();
    if (payload.costPrice !== undefined) updates.costPrice = payload.costPrice.toString();
    if (payload.sku !== undefined) updates.sku = payload.sku?.trim() || null;
    if (payload.categoryId !== undefined) updates.categoryId = payload.categoryId;
    if (payload.isMenuItem !== undefined) updates.isMenuItem = payload.isMenuItem;
    if (payload.minStock !== undefined) updates.minStock = payload.minStock;

    const [updated] = await db.update(products).set(updates).where(eq(products.id, id)).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'UPDATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: id,
      detail: JSON.stringify({ before: existing, after: updated }),
    });

    return { success: true, product: updated };
  } catch (error: any) {
    console.error('Update product error:', error);
    return { error: error.message || 'Gagal mengupdate produk.' };
  }
}

export async function archiveProduct(id: number) {
  const session = await requireAdmin();

  try {
    const [updated] = await db.update(products)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return { error: 'Produk tidak ditemukan.' };
    }

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'ARCHIVE_PRODUCT',
      entity: 'PRODUCT',
      entityId: id,
      detail: null,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Archive product error:', error);
    return { error: 'Gagal mengarsipkan produk.' };
  }
}

// ─── Stock Adjustments ───────────────────────────────────────────────────────

export async function adjustStock(payload: {
  productId: number;
  type: 'IN' | 'OUT' | 'OPNAME';
  quantity: number;
  reason?: string;
}) {
  const session = await requireAuth();

  const product = await db.query.products.findFirst({ where: eq(products.id, payload.productId) });
  if (!product) {
    return { error: 'Produk tidak ditemukan.' };
  }

  let newStock: number;
  let change: number;

  if (payload.type === 'OPNAME') {
    if (payload.quantity < 0) {
      return { error: 'Stok opname tidak boleh negatif.' };
    }
    newStock = payload.quantity;
    change = newStock - product.stock;
  } else if (payload.type === 'IN') {
    if (payload.quantity <= 0) {
      return { error: 'Jumlah masuk harus positif.' };
    }
    change = payload.quantity;
    newStock = product.stock + change;
  } else {
    if (payload.quantity <= 0) {
      return { error: 'Jumlah keluar harus positif.' };
    }
    if (payload.quantity > product.stock) {
      return { error: `Stok tidak cukup. Tersedia: ${product.stock}` };
    }
    change = -payload.quantity;
    newStock = product.stock + change;
  }

  try {
    await db.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, payload.productId));

    const [adjustment] = await db.insert(stockAdjustments).values({
      productId: payload.productId,
      userId: session.userId,
      type: payload.type,
      quantityBefore: product.stock,
      quantityAfter: newStock,
      change,
      reason: payload.reason || null,
    }).returning();

    return { success: true, adjustment };
  } catch (error: any) {
    console.error('Adjust stock error:', error);
    return { error: 'Gagal menyesuaikan stok.' };
  }
}

export async function getStockAdjustments(productId?: number, limit: number = 50) {
  await requireAuth();

  return db.query.stockAdjustments.findMany({
    where: productId ? eq(stockAdjustments.productId, productId) : undefined,
    orderBy: [desc(stockAdjustments.createdAt)],
    limit,
    with: { product: true, user: true },
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
  await requireAuth();
  return db.query.categories.findMany({ orderBy: [categories.sortOrder] });
}

export async function addCategory(payload: { name: string; type: 'STUDIO' | 'FB' }) {
  await requireAdmin();

  if (!payload.name?.trim()) {
    return { error: 'Nama kategori wajib diisi.' };
  }

  try {
    const [category] = await db.insert(categories).values({
      name: payload.name.trim(),
      type: payload.type,
    }).returning();

    return { success: true, category };
  } catch (error: any) {
    console.error('Add category error:', error);
    return { error: 'Gagal menambah kategori.' };
  }
}

// ─── Low Stock Alert ─────────────────────────────────────────────────────────

export async function getLowStockProducts() {
  await requireAuth();

  return db.query.products.findMany({
    where: and(
      eq(products.isArchived, false),
      sql`${products.stock} <= ${products.minStock}`
    ),
    with: { category: true },
  });
}
