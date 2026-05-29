'use server';

import { db } from '@/db';
import { shifts, orders, payments } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Get the current user's open shift.
 * Each user has their own shift — no global shift conflicts.
 */
export async function getMyOpenShift() {
  const session = await requireAuth();

  const openShift = await db.query.shifts.findFirst({
    where: and(eq(shifts.userId, session.userId), eq(shifts.status, 'OPEN')),
    orderBy: [desc(shifts.startTime)],
  });

  return openShift ?? null;
}

/**
 * Check if ANY shift is open (for POS checkout validation)
 */
export async function getAnyOpenShift() {
  await requireAuth();

  const openShift = await db.query.shifts.findFirst({
    where: eq(shifts.status, 'OPEN'),
    orderBy: [desc(shifts.startTime)],
    with: { user: true },
  });

  return openShift ?? null;
}

export async function openShiftAction(_prevState: unknown, formData: FormData) {
  const session = await requireAuth();
  const openingCash = parseFloat(formData.get('openingCash') as string) || 0;

  if (openingCash < 0) {
    return { error: 'Kas awal tidak boleh negatif.' };
  }

  // Check if user already has an open shift
  const existing = await getMyOpenShift();
  if (existing) {
    return { error: 'Anda sudah memiliki shift yang aktif.' };
  }

  try {
    await db.insert(shifts).values({
      userId: session.userId,
      openingCash: openingCash.toString(),
      status: 'OPEN',
      startTime: new Date(),
    });

    revalidatePath('/shift');
    revalidatePath('/pos');
    return { success: true };
  } catch (error) {
    console.error('Open shift error:', error);
    return { error: 'Gagal membuka shift.' };
  }
}

export async function closeShiftAction(_prevState: unknown, formData: FormData) {
  const session = await requireAuth();
  const closingCash = parseFloat(formData.get('closingCash') as string) || 0;
  const note = (formData.get('note') as string)?.trim() || null;

  const activeShift = await getMyOpenShift();
  if (!activeShift) {
    return { error: 'Tidak ada shift aktif.' };
  }

  try {
    // Calculate expected cash: opening + cash sales during shift
    const cashSalesResult = await db
      .select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(
        and(
          eq(orders.shiftId, activeShift.id),
          eq(orders.status, 'COMPLETED'),
          eq(payments.method, 'CASH')
        )
      );

    const cashSales = parseFloat(cashSalesResult[0]?.total || '0');
    const expectedCash = Number(activeShift.openingCash) + cashSales;
    const difference = closingCash - expectedCash;

    // Count transactions
    const txCountResult = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(orders)
      .where(and(eq(orders.shiftId, activeShift.id), eq(orders.status, 'COMPLETED')));

    const totalTransactions = txCountResult[0]?.count || 0;

    // Total sales (all methods)
    const totalSalesResult = await db
      .select({ total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(and(eq(orders.shiftId, activeShift.id), eq(orders.status, 'COMPLETED')));

    const totalSales = totalSalesResult[0]?.total || '0';

    await db.update(shifts).set({
      endTime: new Date(),
      status: 'CLOSED',
      closingCash: closingCash.toString(),
      expectedCash: expectedCash.toString(),
      cashDifference: difference.toString(),
      totalSales,
      totalTransactions,
      note,
    }).where(eq(shifts.id, activeShift.id));

    revalidatePath('/shift');
    revalidatePath('/pos');
    return { success: true, expectedCash, closingCash, difference };
  } catch (error) {
    console.error('Close shift error:', error);
    return { error: 'Gagal menutup shift.' };
  }
}

export async function getShiftHistory(limit: number = 10) {
  const session = await requireAuth();

  // Admin sees all shifts, cashier sees own
  const where = session.role === 'CASHIER'
    ? eq(shifts.userId, session.userId)
    : undefined;

  return db.query.shifts.findMany({
    where,
    orderBy: [desc(shifts.startTime)],
    limit,
    with: { user: true },
  });
}
