'use server';

import { db } from '@/db';
import { products, orders, orderItems, payments, openBills, openBillItems, auditLogs, categories } from '@/db/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { getAnyOpenShift } from './shift-actions';
import { generateInvoiceNumber } from '@/lib/utils';

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';

interface CartItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  productName: string;
}

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

interface CheckoutPayload {
  items: CartItem[];
  payments: PaymentEntry[];
  subtotalAmount: number;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
  customerName?: string;
  note?: string;
}

// ─── Get POS Data ────────────────────────────────────────────────────────────

export async function getPosData() {
  await requireAuth();

  const [allCategories, allProducts] = await Promise.all([
    db.query.categories.findMany({ orderBy: [categories.sortOrder] }),
    db.query.products.findMany({
      where: and(eq(products.isMenuItem, true), eq(products.isArchived, false)),
      with: { category: true },
    }),
  ]);

  return { categories: allCategories, products: allProducts };
}

// ─── Checkout / Process Transaction ──────────────────────────────────────────

export async function processCheckout(data: CheckoutPayload) {
  const session = await requireAuth();
  const openShift = await getAnyOpenShift();

  if (!openShift) {
    return { error: 'Tidak ada shift aktif. Buka shift terlebih dahulu.' };
  }

  // ─── Validations ─────────────────────────────────────────────────────────
  if (!data.items.length) {
    return { error: 'Keranjang kosong.' };
  }

  if (!data.payments.length) {
    return { error: 'Metode pembayaran belum dipilih.' };
  }

  // Validate payment total matches order total
  const paymentTotal = data.payments.reduce((sum, p) => sum + p.amount, 0);
  if (paymentTotal < data.totalAmount) {
    return { error: `Pembayaran kurang. Total: ${data.totalAmount}, Dibayar: ${paymentTotal}` };
  }

  // Validate items have positive quantities
  if (data.items.some((item) => item.quantity <= 0)) {
    return { error: 'Jumlah item harus lebih dari 0.' };
  }

  try {
    const invoiceNumber = generateInvoiceNumber('INV');

    const result = await db.transaction(async (tx) => {
      // ─── Stock Validation (prevent overselling) ────────────────────────
      const productIds = data.items.map((i) => i.productId);
      const currentProducts = await tx.query.products.findMany({
        where: inArray(products.id, productIds),
      });
      const productMap = new Map(currentProducts.map((p) => [p.id, p]));

      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Produk ID ${item.productId} tidak ditemukan.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Stok "${product.name}" tidak cukup. Tersedia: ${product.stock}, Diminta: ${item.quantity}`);
        }
      }

      // ─── Create Order ──────────────────────────────────────────────────
      const [newOrder] = await tx.insert(orders).values({
        invoiceNumber,
        shiftId: openShift.id,
        userId: session.userId,
        customerName: data.customerName || null,
        subtotalAmount: data.subtotalAmount.toString(),
        discountType: data.discountType,
        discountValue: data.discountValue.toString(),
        discountAmount: data.discountAmount.toString(),
        totalAmount: data.totalAmount.toString(),
        note: data.note || null,
        status: 'COMPLETED',
      }).returning();

      // ─── Insert Order Items ────────────────────────────────────────────
      await tx.insert(orderItems).values(
        data.items.map((item) => {
          const product = productMap.get(item.productId)!;
          return {
            orderId: newOrder.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            costPrice: product.costPrice,
            subtotal: (item.unitPrice * item.quantity).toString(),
          };
        })
      );

      // ─── Deduct Stock ──────────────────────────────────────────────────
      for (const item of data.items) {
        await tx.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      // ─── Insert Payments ───────────────────────────────────────────────
      await tx.insert(payments).values(
        data.payments.map((p) => ({
          orderId: newOrder.id,
          method: p.method,
          amount: p.amount.toString(),
        }))
      );

      // ─── Audit Log ────────────────────────────────────────────────────
      await tx.insert(auditLogs).values({
        userId: session.userId,
        action: 'CREATE_ORDER',
        entity: 'ORDER',
        entityId: newOrder.id,
        detail: JSON.stringify({
          invoiceNumber,
          total: data.totalAmount,
          items: data.items.length,
          payments: data.payments,
        }),
      });

      return newOrder;
    });

    return {
      success: true,
      orderId: result.id,
      invoiceNumber,
      totalAmount: data.totalAmount,
      change: paymentTotal - data.totalAmount,
    };
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return { error: error.message || 'Transaksi gagal.' };
  }
}

// ─── Open Bills ──────────────────────────────────────────────────────────────

export async function getOpenBills() {
  await requireAuth();

  const bills = await db.query.openBills.findMany({
    where: inArray(openBills.status, ['OPEN', 'PARTIAL']),
    with: { items: true, user: { columns: { id: true, name: true } } },
    orderBy: [desc(openBills.updatedAt)],
  });

  return bills.map((bill) => ({
    id: bill.id,
    billNumber: bill.billNumber,
    customerName: bill.customerName,
    note: bill.note,
    subtotalAmount: Number(bill.subtotalAmount),
    discountAmount: Number(bill.discountAmount),
    totalAmount: Number(bill.totalAmount),
    downPayment: Number(bill.downPayment),
    status: bill.status,
    itemCount: bill.items.length,
    cashierName: bill.user?.name || '-',
    updatedAt: bill.updatedAt.toISOString(),
  }));
}

interface SaveOpenBillPayload {
  billId?: number;
  items: CartItem[];
  subtotalAmount: number;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
  downPayment?: number;
  downPaymentMethod?: PaymentMethod;
  customerName?: string;
  note?: string;
}

export async function saveOpenBill(data: SaveOpenBillPayload) {
  const session = await requireAuth();

  if (!data.items.length) {
    return { error: 'Keranjang kosong.' };
  }

  const downPayment = Math.max(0, Math.min(data.totalAmount, data.downPayment || 0));

  try {
    const result = await db.transaction(async (tx) => {
      let billId = data.billId;

      if (!billId) {
        // Create new open bill
        const billNumber = generateInvoiceNumber('OB');
        const [newBill] = await tx.insert(openBills).values({
          billNumber,
          userId: session.userId,
          customerName: data.customerName || null,
          note: data.note || null,
          subtotalAmount: data.subtotalAmount.toString(),
          discountType: data.discountType,
          discountValue: data.discountValue.toString(),
          discountAmount: data.discountAmount.toString(),
          totalAmount: data.totalAmount.toString(),
          downPayment: downPayment.toString(),
          downPaymentMethod: downPayment > 0 ? (data.downPaymentMethod || 'CASH') : null,
          status: downPayment > 0 ? 'PARTIAL' : 'OPEN',
        }).returning();
        billId = newBill.id;
      } else {
        // Update existing bill
        const existing = await tx.query.openBills.findFirst({
          where: eq(openBills.id, billId),
        });
        if (!existing || !['OPEN', 'PARTIAL'].includes(existing.status)) {
          throw new Error('Open bill tidak ditemukan atau sudah ditutup.');
        }

        await tx.update(openBills).set({
          customerName: data.customerName || null,
          note: data.note || null,
          subtotalAmount: data.subtotalAmount.toString(),
          discountType: data.discountType,
          discountValue: data.discountValue.toString(),
          discountAmount: data.discountAmount.toString(),
          totalAmount: data.totalAmount.toString(),
          downPayment: downPayment.toString(),
          downPaymentMethod: downPayment > 0 ? (data.downPaymentMethod || existing.downPaymentMethod || 'CASH') : null,
          status: downPayment > 0 ? 'PARTIAL' : 'OPEN',
          updatedAt: new Date(),
        }).where(eq(openBills.id, billId));

        // Remove old items
        await tx.delete(openBillItems).where(eq(openBillItems.openBillId, billId));
      }

      // Insert items
      await tx.insert(openBillItems).values(
        data.items.map((item) => ({
          openBillId: billId!,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
        }))
      );

      return billId;
    });

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: data.billId ? 'UPDATE_OPEN_BILL' : 'CREATE_OPEN_BILL',
      entity: 'OPEN_BILL',
      entityId: result,
      detail: JSON.stringify({ items: data.items.length, total: data.totalAmount }),
    });

    return { success: true, billId: result };
  } catch (error: any) {
    console.error('Save Open Bill Error:', error);
    return { error: error.message || 'Gagal menyimpan open bill.' };
  }
}

export async function closeOpenBill(billId: number, paymentData: { payments: PaymentEntry[] }) {
  const session = await requireAuth();
  const openShift = await getAnyOpenShift();

  if (!openShift) {
    return { error: 'Tidak ada shift aktif.' };
  }

  const bill = await db.query.openBills.findFirst({
    where: eq(openBills.id, billId),
    with: { items: true },
  });

  if (!bill || !['OPEN', 'PARTIAL'].includes(bill.status)) {
    return { error: 'Open bill tidak ditemukan atau sudah ditutup.' };
  }

  const remaining = Number(bill.totalAmount) - Number(bill.downPayment);
  const paymentTotal = paymentData.payments.reduce((sum, p) => sum + p.amount, 0);

  if (paymentTotal < remaining) {
    return { error: `Pembayaran kurang. Sisa: ${remaining}, Dibayar: ${paymentTotal}` };
  }

  // Convert to checkout
  const checkoutData: CheckoutPayload = {
    items: bill.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
    payments: paymentData.payments,
    subtotalAmount: Number(bill.subtotalAmount),
    discountType: (bill.discountType as 'FIXED' | 'PERCENT') || 'FIXED',
    discountValue: Number(bill.discountValue),
    discountAmount: Number(bill.discountAmount),
    totalAmount: remaining, // Only charge remaining
    customerName: bill.customerName || undefined,
    note: bill.note || undefined,
  };

  const result = await processCheckout(checkoutData);

  if (result.success) {
    // Mark bill as closed
    await db.update(openBills).set({
      status: 'CLOSED',
      closedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(openBills.id, billId));
  }

  return result;
}

export async function voidOpenBill(billId: number, reason?: string) {
  const session = await requireAuth();

  const bill = await db.query.openBills.findFirst({
    where: eq(openBills.id, billId),
  });

  if (!bill || !['OPEN', 'PARTIAL'].includes(bill.status)) {
    return { error: 'Open bill tidak ditemukan atau sudah ditutup.' };
  }

  await db.update(openBills).set({
    status: 'VOID',
    note: reason ? `VOID: ${reason}` : bill.note,
    closedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(openBills.id, billId));

  await db.insert(auditLogs).values({
    userId: session.userId,
    action: 'VOID_OPEN_BILL',
    entity: 'OPEN_BILL',
    entityId: billId,
    detail: JSON.stringify({ reason, billNumber: bill.billNumber }),
  });

  return { success: true };
}
