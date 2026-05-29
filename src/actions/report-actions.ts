'use server';

import { db } from '@/db';
import { orders, orderItems, payments, expenses, incomes, shifts } from '@/db/schema';
import { and, gte, lt, eq, desc, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface ReportParams {
  from: Date;
  to: Date;
}

export async function getFinancialReport({ from, to }: ReportParams) {
  await requireAdmin();

  // Fetch completed orders in range
  const ordersInRange = await db.query.orders.findMany({
    where: and(
      gte(orders.createdAt, from),
      lt(orders.createdAt, to),
      eq(orders.status, 'COMPLETED')
    ),
    with: { items: true, payments: true },
    orderBy: [desc(orders.createdAt)],
  });

  // Revenue from payments
  const totalRevenue = ordersInRange.reduce((sum, o) => {
    return sum + (o.payments || []).reduce((s, p) => s + Number(p.amount), 0);
  }, 0);

  // COGS
  const totalCogs = ordersInRange.reduce((sum, o) => {
    return sum + (o.items || []).reduce((s, item) => s + Number(item.costPrice) * item.quantity, 0);
  }, 0);

  // Payment breakdown
  const paymentBreakdown: Record<string, number> = { CASH: 0, QRIS: 0, TRANSFER: 0 };
  for (const o of ordersInRange) {
    for (const p of o.payments || []) {
      paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + Number(p.amount);
    }
  }

  // Daily revenue
  const dailyRevenue: Record<string, number> = {};
  for (const o of ordersInRange) {
    const key = toDateKey(o.createdAt);
    const paid = (o.payments || []).reduce((s, p) => s + Number(p.amount), 0);
    dailyRevenue[key] = (dailyRevenue[key] || 0) + paid;
  }

  // Expenses
  const expensesInRange = await db.query.expenses.findMany({
    where: and(gte(expenses.date, from), lt(expenses.date, to)),
    with: { user: true },
    orderBy: [desc(expenses.date)],
  });
  const totalExpenses = expensesInRange.reduce((sum, e) => sum + Number(e.amount), 0);

  // Incomes (additional)
  const incomesInRange = await db.query.incomes.findMany({
    where: and(gte(incomes.date, from), lt(incomes.date, to)),
    with: { user: true },
    orderBy: [desc(incomes.date)],
  });
  const totalIncomes = incomesInRange.reduce((sum, i) => sum + Number(i.amount), 0);

  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses + totalIncomes;

  return {
    totalRevenue,
    totalOrders: ordersInRange.length,
    totalCogs,
    grossProfit,
    totalExpenses,
    totalIncomes,
    netProfit,
    paymentBreakdown,
    dailyRevenue,
    expenses: expensesInRange,
    incomes: incomesInRange,
  };
}

export async function getTopProducts({ from, to, limit = 10 }: ReportParams & { limit?: number }) {
  await requireAdmin();

  const ordersInRange = await db.query.orders.findMany({
    where: and(
      gte(orders.createdAt, from),
      lt(orders.createdAt, to),
      eq(orders.status, 'COMPLETED')
    ),
    with: { items: true },
  });

  const agg: Record<number, { productName: string; qty: number; revenue: number }> = {};
  for (const o of ordersInRange) {
    for (const item of o.items || []) {
      const pid = item.productId;
      if (!agg[pid]) agg[pid] = { productName: item.productName, qty: 0, revenue: 0 };
      agg[pid].qty += item.quantity;
      agg[pid].revenue += Number(item.subtotal);
    }
  }

  return Object.entries(agg)
    .map(([id, data]) => ({ productId: Number(id), ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}
