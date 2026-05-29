'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { createSession, deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return { error: 'Email atau password salah.' };
  }

  if (!user.isActive) {
    return { error: 'Akun Anda telah dinonaktifkan. Hubungi admin.' };
  }

  const isValid = await compare(password, user.password);
  if (!isValid) {
    return { error: 'Email atau password salah.' };
  }

  await createSession({
    userId: user.id,
    name: user.name,
    role: user.role,
  });

  const target = user.role === 'CASHIER' ? '/pos' : '/dashboard';
  redirect(target);
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}
