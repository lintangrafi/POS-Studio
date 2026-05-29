'use client';

import { useActionState, useEffect, useState } from 'react';
import { loginAction } from '@/actions/auth-actions';
import { getStoreSettings } from '@/actions/store-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const THEME_LOGO_BG: Record<string, string> = {
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-600',
  rose: 'bg-rose-600',
  amber: 'bg-amber-600',
  violet: 'bg-violet-600',
  sky: 'bg-sky-600',
};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [store, setStore] = useState({ storeName: 'Studio POS', logoInitial: 'S', theme: 'indigo' });

  useEffect(() => {
    getStoreSettings().then((s) => setStore(s));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className={cn(
            'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg',
            THEME_LOGO_BG[store.theme] || 'bg-indigo-600'
          )}>
            {store.logoInitial}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{store.storeName}</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk ke akun Anda</p>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@studio.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  );
}
