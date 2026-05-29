'use server';

import { db } from '@/db';
import { orders, payments, auditLogs, products, orderItems, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { hash } from 'bcryptjs';

// ─── Void Order ──────────────────────────────────────────────────────────────

export async function voidOrder(orderId: number, reason: string) {
  const session = await requireAdmin();

  if (!reason?.trim()) {
    return { error: 'Alasan void wajib diisi.' };
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!order) return { error: 'Order tidak ditemukan.' };
  if (order.status === 'VOID') return { error: 'Order sudah di-void.' };

  try {
    await db.transaction(async (tx) => {
      // Mark order as void
      await tx.update(orders).set({
        status: 'VOID',
        voidReason: reason.trim(),
        voidedBy: session.userId,
        voidedAt: new Date(),
      }).where(eq(orders.id, orderId));

      // Restore stock
      for (const item of order.items) {
        await tx.update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      // Audit log
      await tx.insert(auditLogs).values({
        userId: session.userId,
        action: 'VOID_ORDER',
        entity: 'ORDER',
        entityId: orderId,
        detail: JSON.stringify({ reason, invoiceNumber: order.invoiceNumber }),
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('Void order error:', error);
    return { error: 'Gagal void order.' };
  }
}

// ─── User Management ─────────────────────────────────────────────────────────

export async function getUsers() {
  await requireAdmin();
  return db.query.users.findMany({
    columns: { password: false },
  });
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: 'CASHIER' | 'ADMIN' | 'SUPERADMIN';
}) {
  const session = await requireAdmin();

  if (!payload.name?.trim()) {
    return { error: 'Nama wajib diisi.' };
  }
  if (!payload.email?.trim()) {
    return { error: 'Email wajib diisi.' };
  }
  if (!payload.password || payload.password.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  // Prevent privilege escalation: only SUPERADMIN can create SUPERADMIN
  if (payload.role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
    return { error: 'Hanya Super Admin yang dapat membuat akun Super Admin.' };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, payload.email.toLowerCase().trim()),
  });
  if (existing) {
    return { error: 'Email sudah terdaftar.' };
  }

  try {
    const hashedPassword = await hash(payload.password, 12);

    const [user] = await db.insert(users).values({
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      password: hashedPassword,
      role: payload.role,
    }).returning();

    return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  } catch (error: any) {
    console.error('Create user error:', error);
    return { error: 'Gagal membuat pengguna.' };
  }
}

export async function toggleUserActive(userId: number) {
  const session = await requireAdmin();

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return { error: 'User tidak ditemukan.' };
  }

  // Prevent deactivating yourself
  if (user.id === session.userId) {
    return { error: 'Tidak dapat menonaktifkan akun sendiri.' };
  }

  // Prevent non-superadmin from deactivating superadmin
  if (user.role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
    return { error: 'Hanya Super Admin yang dapat menonaktifkan Super Admin lain.' };
  }

  try {
    const [updated] = await db.update(users)
      .set({ isActive: !user.isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return { success: true, id: updated.id, isActive: updated.isActive };
  } catch (error: any) {
    console.error('Toggle user error:', error);
    return { error: 'Gagal mengubah status pengguna.' };
  }
}
