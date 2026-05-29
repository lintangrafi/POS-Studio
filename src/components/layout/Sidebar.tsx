'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ShoppingCart,
  Clock,
  Package,
  BarChart3,
  FileText,
  Settings,
  Palette,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth-actions';
import { useState, useEffect, useCallback } from 'react';

interface SidebarProps {
  role: 'CASHIER' | 'ADMIN' | 'SUPERADMIN';
  userName: string;
  storeSettings: {
    storeName: string;
    storeSubtitle: string;
    logoInitial: string;
    theme: string;
  };
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERADMIN'] },
  { href: '/pos', label: 'Kasir', icon: ShoppingCart, roles: ['CASHIER', 'ADMIN', 'SUPERADMIN'] },
  { href: '/shift', label: 'Shift', icon: Clock, roles: ['CASHIER', 'ADMIN', 'SUPERADMIN'] },
  { href: '/inventory', label: 'Inventori', icon: Package, roles: ['ADMIN', 'SUPERADMIN'] },
  { href: '/reports', label: 'Laporan', icon: BarChart3, roles: ['ADMIN', 'SUPERADMIN'] },
  { href: '/invoices', label: 'Invoice', icon: FileText, roles: ['ADMIN', 'SUPERADMIN'] },
  { href: '/settings', label: 'Pengaturan', icon: Settings, roles: ['ADMIN', 'SUPERADMIN'] },
  { href: '/settings/customize', label: 'Kustomisasi', icon: Palette, roles: ['ADMIN', 'SUPERADMIN'] },
];

const THEME_COLORS: Record<string, { active: string; activeText: string; logoBg: string }> = {
  indigo: { active: 'bg-indigo-600/10', activeText: 'text-indigo-400', logoBg: 'bg-indigo-600' },
  emerald: { active: 'bg-emerald-600/10', activeText: 'text-emerald-400', logoBg: 'bg-emerald-600' },
  rose: { active: 'bg-rose-600/10', activeText: 'text-rose-400', logoBg: 'bg-rose-600' },
  amber: { active: 'bg-amber-600/10', activeText: 'text-amber-400', logoBg: 'bg-amber-600' },
  violet: { active: 'bg-violet-600/10', activeText: 'text-violet-400', logoBg: 'bg-violet-600' },
  sky: { active: 'bg-sky-600/10', activeText: 'text-sky-400', logoBg: 'bg-sky-600' },
};

export function Sidebar({ role, userName, storeSettings }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const themeColors = THEME_COLORS[storeSettings.theme] || THEME_COLORS.indigo;

  // Close mobile menu on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileOpen) {
      setMobileOpen(false);
    }
  }, [mobileOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white', themeColors.logoBg)}>
          {storeSettings.logoInitial}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{storeSettings.storeName}</p>
          <p className="text-xs text-slate-400">{storeSettings.storeSubtitle}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Menu utama">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? `${themeColors.active} ${themeColors.activeText}`
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn('h-4.5 w-4.5', active && themeColors.activeText)} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-slate-400 capitalize">{role.toLowerCase()}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-400 hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-slate-900 p-2 text-white shadow-lg lg:hidden"
        aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900">
        {navContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
          >
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
