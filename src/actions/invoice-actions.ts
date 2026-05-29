'use server';

import { db } from '@/db';
import { orders, payments } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export async function getInvoices(limit: number = 100) {
  await requireAdmin();

  const allOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit,
    with: {
      payments: true,
      user: { columns: { id: true, name: true } },
      items: true,
    },
  });

  return allOrders.map((order) => ({
    id: order.id,
    invoiceNumber: order.invoiceNumber,
    customerName: order.customerName,
    subtotalAmount: order.subtotalAmount,
    discountAmount: order.discountAmount,
    totalAmount: order.totalAmount,
    status: order.status,
    note: order.note,
    voidReason: order.voidReason,
    createdAt: order.createdAt.toISOString(),
    cashierName: order.user?.name || '-',
    paymentMethods: [...new Set(order.payments.map((p) => p.method))],
    itemCount: order.items.length,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  }));
}
