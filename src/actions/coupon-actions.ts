'use server';

import { db } from '@/db';
import { coupons, auditLogs } from '@/db/schema';
import { eq, and, gte, lte, or, isNull, desc } from 'drizzle-orm';
import { requireAdmin, requireAuth } from '@/lib/auth';

export async function getCoupons() {
  await requireAdmin();
  return db.query.coupons.findMany({ orderBy: [desc(coupons.createdAt)] });
}

export async function addCoupon(payload: {
  code: string;
  description?: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom?: string;
  validUntil?: string;
}) {
  const session = await requireAdmin();

  if (!payload.code?.trim()) return { error: 'Kode kupon wajib diisi.' };
  if (payload.discountValue <= 0) return { error: 'Nilai diskon harus lebih dari 0.' };

  const existing = await db.query.coupons.findFirst({
    where: eq(coupons.code, payload.code.trim().toUpperCase()),
  });
  if (existing) return { error: 'Kode kupon sudah digunakan.' };

  try {
    const [coupon] = await db.insert(coupons).values({
      code: payload.code.trim().toUpperCase(),
      description: payload.description?.trim() || null,
      discountType: payload.discountType,
      discountValue: payload.discountValue.toString(),
      minPurchase: (payload.minPurchase || 0).toString(),
      maxDiscount: payload.maxDiscount ? payload.maxDiscount.toString() : null,
      usageLimit: payload.usageLimit || null,
      validFrom: payload.validFrom ? new Date(payload.validFrom) : null,
      validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'CREATE_COUPON',
      entity: 'COUPON',
      entityId: coupon.id,
      detail: JSON.stringify(coupon),
    });

    return { success: true, coupon };
  } catch (error: any) {
    return { error: 'Gagal membuat kupon.' };
  }
}

export async function updateCoupon(id: number, payload: {
  description?: string;
  discountType?: 'FIXED' | 'PERCENT';
  discountValue?: number;
  minPurchase?: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
}) {
  const session = await requireAdmin();

  const existing = await db.query.coupons.findFirst({ where: eq(coupons.id, id) });
  if (!existing) return { error: 'Kupon tidak ditemukan.' };

  try {
    const updates: Record<string, any> = {};
    if (payload.description !== undefined) updates.description = payload.description?.trim() || null;
    if (payload.discountType !== undefined) updates.discountType = payload.discountType;
    if (payload.discountValue !== undefined) updates.discountValue = payload.discountValue.toString();
    if (payload.minPurchase !== undefined) updates.minPurchase = payload.minPurchase.toString();
    if (payload.maxDiscount !== undefined) updates.maxDiscount = payload.maxDiscount ? payload.maxDiscount.toString() : null;
    if (payload.usageLimit !== undefined) updates.usageLimit = payload.usageLimit;
    if (payload.isActive !== undefined) updates.isActive = payload.isActive;
    if (payload.validFrom !== undefined) updates.validFrom = payload.validFrom ? new Date(payload.validFrom) : null;
    if (payload.validUntil !== undefined) updates.validUntil = payload.validUntil ? new Date(payload.validUntil) : null;

    const [updated] = await db.update(coupons).set(updates).where(eq(coupons.id, id)).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'UPDATE_COUPON',
      entity: 'COUPON',
      entityId: id,
      detail: JSON.stringify({ before: existing, after: updated }),
    });

    return { success: true, coupon: updated };
  } catch (error: any) {
    return { error: 'Gagal mengupdate kupon.' };
  }
}

export async function deleteCoupon(id: number) {
  const session = await requireAdmin();

  try {
    await db.delete(coupons).where(eq(coupons.id, id));
    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'DELETE_COUPON',
      entity: 'COUPON',
      entityId: id,
      detail: null,
    });
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal menghapus kupon.' };
  }
}

/**
 * Validate and apply a coupon code (called from POS by cashier)
 */
export async function validateCoupon(code: string, subtotal: number) {
  await requireAuth();

  const coupon = await db.query.coupons.findFirst({
    where: eq(coupons.code, code.trim().toUpperCase()),
  });

  if (!coupon) return { error: 'Kode kupon tidak ditemukan.' };
  if (!coupon.isActive) return { error: 'Kupon sudah tidak aktif.' };

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) return { error: 'Kupon belum berlaku.' };
  if (coupon.validUntil && now > coupon.validUntil) return { error: 'Kupon sudah kadaluarsa.' };
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { error: 'Kupon sudah mencapai batas penggunaan.' };

  const minPurchase = Number(coupon.minPurchase);
  if (subtotal < minPurchase) {
    return { error: `Minimum pembelian ${minPurchase.toLocaleString('id-ID')} untuk kupon ini.` };
  }

  // Calculate discount
  let discountAmount: number;
  if (coupon.discountType === 'PERCENT') {
    discountAmount = Math.round((subtotal * Number(coupon.discountValue)) / 100);
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  } else {
    discountAmount = Math.min(Number(coupon.discountValue), subtotal);
  }

  return {
    success: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType as 'FIXED' | 'PERCENT',
      discountValue: Number(coupon.discountValue),
      discountAmount,
      description: coupon.description,
    },
  };
}

/**
 * Increment coupon usage count (called after successful checkout)
 */
export async function incrementCouponUsage(code: string) {
  await db.update(coupons)
    .set({ usageCount: (await db.query.coupons.findFirst({ where: eq(coupons.code, code) }))!.usageCount + 1 })
    .where(eq(coupons.code, code));
}
