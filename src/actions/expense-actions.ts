'use server';

import { db } from '@/db';
import { expenses, incomes, auditLogs } from '@/db/schema';
import { and, gte, lt, desc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';
type ExpenseCategory = 'SUPPLIES' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER';
type IncomeCategory = 'SERVICE' | 'REFUND' | 'OTHER';

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function addExpense(payload: {
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
}) {
  const session = await requireAdmin();

  if (!payload.description?.trim()) {
    return { error: 'Deskripsi wajib diisi.' };
  }
  if (payload.amount <= 0) {
    return { error: 'Jumlah harus lebih dari 0.' };
  }

  try {
    const [expense] = await db.insert(expenses).values({
      userId: session.userId,
      description: payload.description.trim(),
      amount: payload.amount.toString(),
      category: payload.category,
      paymentMethod: payload.paymentMethod,
      date: new Date(payload.date),
      notes: payload.notes?.trim() || null,
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'CREATE_EXPENSE',
      entity: 'EXPENSE',
      entityId: expense.id,
      detail: JSON.stringify(expense),
    });

    return { success: true, expense };
  } catch (error: any) {
    console.error('Add expense error:', error);
    return { error: 'Gagal menambah pengeluaran.' };
  }
}

export async function updateExpense(id: number, payload: {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  date?: string;
  notes?: string;
}) {
  const session = await requireAdmin();

  const existing = await db.query.expenses.findFirst({ where: eq(expenses.id, id) });
  if (!existing) {
    return { error: 'Pengeluaran tidak ditemukan.' };
  }

  try {
    const updates: Record<string, any> = {};
    if (payload.description !== undefined) updates.description = payload.description.trim();
    if (payload.amount !== undefined) updates.amount = payload.amount.toString();
    if (payload.category !== undefined) updates.category = payload.category;
    if (payload.paymentMethod !== undefined) updates.paymentMethod = payload.paymentMethod;
    if (payload.date !== undefined) updates.date = new Date(payload.date);
    if (payload.notes !== undefined) updates.notes = payload.notes?.trim() || null;

    const [updated] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'UPDATE_EXPENSE',
      entity: 'EXPENSE',
      entityId: id,
      detail: JSON.stringify({ before: existing, after: updated }),
    });

    return { success: true, expense: updated };
  } catch (error: any) {
    console.error('Update expense error:', error);
    return { error: 'Gagal mengupdate pengeluaran.' };
  }
}

export async function getExpenses({ from, to }: { from: Date; to: Date }) {
  await requireAdmin();

  return db.query.expenses.findMany({
    where: and(gte(expenses.date, from), lt(expenses.date, to)),
    with: { user: true },
    orderBy: [desc(expenses.date)],
  });
}

export async function deleteExpense(id: number) {
  const session = await requireAdmin();

  const existing = await db.query.expenses.findFirst({ where: eq(expenses.id, id) });
  if (!existing) {
    return { error: 'Expense tidak ditemukan.' };
  }

  try {
    await db.delete(expenses).where(eq(expenses.id, id));

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'DELETE_EXPENSE',
      entity: 'EXPENSE',
      entityId: id,
      detail: JSON.stringify(existing),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return { error: 'Gagal menghapus pengeluaran.' };
  }
}

// ─── Incomes ─────────────────────────────────────────────────────────────────

export async function addIncome(payload: {
  description: string;
  amount: number;
  category: IncomeCategory;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
}) {
  const session = await requireAdmin();

  if (!payload.description?.trim()) {
    return { error: 'Deskripsi wajib diisi.' };
  }
  if (payload.amount <= 0) {
    return { error: 'Jumlah harus lebih dari 0.' };
  }

  try {
    const [income] = await db.insert(incomes).values({
      userId: session.userId,
      description: payload.description.trim(),
      amount: payload.amount.toString(),
      category: payload.category,
      paymentMethod: payload.paymentMethod,
      date: new Date(payload.date),
      notes: payload.notes?.trim() || null,
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'CREATE_INCOME',
      entity: 'INCOME',
      entityId: income.id,
      detail: JSON.stringify(income),
    });

    return { success: true, income };
  } catch (error: any) {
    console.error('Add income error:', error);
    return { error: 'Gagal menambah pendapatan.' };
  }
}

export async function updateIncome(id: number, payload: {
  description?: string;
  amount?: number;
  category?: IncomeCategory;
  paymentMethod?: PaymentMethod;
  date?: string;
  notes?: string;
}) {
  const session = await requireAdmin();

  const existing = await db.query.incomes.findFirst({ where: eq(incomes.id, id) });
  if (!existing) {
    return { error: 'Pendapatan tidak ditemukan.' };
  }

  try {
    const updates: Record<string, any> = {};
    if (payload.description !== undefined) updates.description = payload.description.trim();
    if (payload.amount !== undefined) updates.amount = payload.amount.toString();
    if (payload.category !== undefined) updates.category = payload.category;
    if (payload.paymentMethod !== undefined) updates.paymentMethod = payload.paymentMethod;
    if (payload.date !== undefined) updates.date = new Date(payload.date);
    if (payload.notes !== undefined) updates.notes = payload.notes?.trim() || null;

    const [updated] = await db.update(incomes).set(updates).where(eq(incomes.id, id)).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'UPDATE_INCOME',
      entity: 'INCOME',
      entityId: id,
      detail: JSON.stringify({ before: existing, after: updated }),
    });

    return { success: true, income: updated };
  } catch (error: any) {
    console.error('Update income error:', error);
    return { error: 'Gagal mengupdate pendapatan.' };
  }
}

export async function getIncomes({ from, to }: { from: Date; to: Date }) {
  await requireAdmin();

  return db.query.incomes.findMany({
    where: and(gte(incomes.date, from), lt(incomes.date, to)),
    with: { user: true },
    orderBy: [desc(incomes.date)],
  });
}

export async function deleteIncome(id: number) {
  const session = await requireAdmin();

  const existing = await db.query.incomes.findFirst({ where: eq(incomes.id, id) });
  if (!existing) {
    return { error: 'Pendapatan tidak ditemukan.' };
  }

  try {
    await db.delete(incomes).where(eq(incomes.id, id));

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'DELETE_INCOME',
      entity: 'INCOME',
      entityId: id,
      detail: JSON.stringify(existing),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Delete income error:', error);
    return { error: 'Gagal menghapus pendapatan.' };
  }
}
