'use server';

import { db } from '@/db';
import { orders, payments, products, auditLogs } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
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
    discountType: order.discountType,
    discountValue: order.discountValue,
    discountAmount: order.discountAmount,
    totalAmount: order.totalAmount,
    status: order.status,
    note: order.note,
    voidReason: order.voidReason,
    couponCode: order.couponCode,
    createdAt: order.createdAt.toISOString(),
    cashierName: order.user?.name || '-',
    paymentMethods: [...new Set(order.payments.map((p) => p.method))],
    itemCount: order.items.length,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
    payments: order.payments.map((p) => ({
      method: p.method,
      amount: Number(p.amount),
    })),
  }));
}

export async function getInvoiceDetail(id: number) {
  await requireAdmin();

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      payments: true,
      user: { columns: { id: true, name: true } },
      items: true,
      shift: { columns: { id: true, startTime: true } },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    invoiceNumber: order.invoiceNumber,
    customerName: order.customerName,
    subtotalAmount: Number(order.subtotalAmount),
    discountType: order.discountType,
    discountValue: Number(order.discountValue),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    status: order.status,
    note: order.note,
    voidReason: order.voidReason,
    couponCode: order.couponCode,
    createdAt: order.createdAt.toISOString(),
    cashierName: order.user?.name || '-',
    shiftId: order.shift?.id,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      costPrice: Number(item.costPrice),
      subtotal: Number(item.subtotal),
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount),
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

export async function voidInvoice(id: number, reason: string) {
  const session = await requireAdmin();

  // Only SUPERADMIN can void
  if (session.role !== 'SUPERADMIN') {
    return { error: 'Hanya SUPERADMIN yang dapat memvoid invoice.' };
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });

  if (!order) return { error: 'Invoice tidak ditemukan.' };
  if (order.status === 'VOID') return { error: 'Invoice sudah divoid.' };
  if (!reason?.trim()) return { error: 'Alasan void wajib diisi.' };

  try {
    // Void the order
    await db.update(orders).set({
      status: 'VOID',
      voidReason: reason.trim(),
      voidedBy: session.userId,
      voidedAt: new Date(),
    }).where(eq(orders.id, id));

    // Restore stock
    for (const item of order.items) {
      await db.update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'VOID_ORDER',
      entity: 'ORDER',
      entityId: id,
      detail: JSON.stringify({ reason, invoiceNumber: order.invoiceNumber }),
    });

    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal memvoid invoice.' };
  }
}

export async function deleteInvoice(id: number) {
  const session = await requireAdmin();

  if (session.role !== 'SUPERADMIN') {
    return { error: 'Hanya SUPERADMIN yang dapat menghapus invoice.' };
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });

  if (!order) return { error: 'Invoice tidak ditemukan.' };

  try {
    // If order was COMPLETED, restore stock
    if (order.status === 'COMPLETED') {
      for (const item of order.items) {
        await db.update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
    }

    // Delete payments, items, then order
    await db.delete(payments).where(eq(payments.orderId, id));
    const { orderItems } = await import('@/db/schema');
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: 'DELETE_ORDER',
      entity: 'ORDER',
      entityId: id,
      detail: JSON.stringify({ invoiceNumber: order.invoiceNumber }),
    });

    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal menghapus invoice.' };
  }
}
