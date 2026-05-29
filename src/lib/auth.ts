import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'dev-only-fallback-secret-do-not-use-in-production'
);

const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours

export type UserRole = 'CASHIER' | 'ADMIN' | 'SUPERADMIN';

export type SessionPayload = {
  userId: number;
  name: string;
  role: UserRole;
  exp?: number;
};

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION / 1000}s`)
    .sign(SECRET_KEY);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: ['HS256'] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return decrypt(token);
}

/**
 * Verify session exists, redirect to login if not.
 * Use in server actions and server components.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }
  return session;
}

/**
 * Require admin or superadmin role
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role === 'CASHIER') {
    throw new Error('Akses ditolak. Hanya admin yang dapat melakukan aksi ini.');
  }
  return session;
}

export async function createSession(payload: Omit<SessionPayload, 'exp'>): Promise<void> {
  const token = await encrypt(payload);
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION / 1000,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
