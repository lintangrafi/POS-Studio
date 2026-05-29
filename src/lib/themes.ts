import type { StoreTheme } from '@/actions/store-actions';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryText: string;
  primaryBg: string;
  primaryRing: string;
  sidebarBg: string;
  sidebarBorder: string;
  sidebarActive: string;
  sidebarActiveText: string;
  logoBg: string;
}

const themes: Record<StoreTheme, ThemeColors> = {
  indigo: {
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    primaryLight: 'bg-indigo-50',
    primaryText: 'text-indigo-600',
    primaryBg: 'bg-indigo-600',
    primaryRing: 'ring-indigo-200',
    sidebarBg: 'bg-slate-900',
    sidebarBorder: 'border-slate-800',
    sidebarActive: 'bg-indigo-600/10',
    sidebarActiveText: 'text-indigo-400',
    logoBg: 'bg-indigo-600',
  },
  emerald: {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryLight: 'bg-emerald-50',
    primaryText: 'text-emerald-600',
    primaryBg: 'bg-emerald-600',
    primaryRing: 'ring-emerald-200',
    sidebarBg: 'bg-slate-900',
    sidebarBorder: 'border-slate-800',
    sidebarActive: 'bg-emerald-600/10',
    sidebarActiveText: 'text-emerald-400',
    logoBg: 'bg-emerald-600',
  },
  rose: {
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    primaryLight: 'bg-rose-50',
    primaryText: 'text-rose-600',
    primaryBg: 'bg-rose-600',
    primaryRing: 'ring-rose-200',
    sidebarBg: 'bg-slate-900',
    sidebarBorder: 'border-slate-800',
    sidebarActive: 'bg-rose-600/10',
    sidebarActiveText: 'text-rose-400',
    logoBg: 'bg-rose-600',
  },
  amber: {
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    primaryLight: 'bg-amber-50',
    primaryText: 'text-amber-600',
    primaryBg: 'bg-amber-600',
    primaryRing: 'ring-amber-200',
    sidebarBg: 'bg-slate-900',
    sidebarBorder: 'border-slate-800',
    sidebarActive: 'bg-amber-600/10',
    sidebarActiveText: 'text-amber-400',
    logoBg: 'bg-amber-600',
  },
  violet: {
    primary: 'bg-violet-600',
    primaryHover: 'hover:bg-violet-700',
    primaryLight: 'bg-violet-50',
    primaryText: 'text-violet-600',
    primaryBg: 'bg-violet-600',
    primaryRing: 'ring-violet-200',
    sidebarBg: 'bg-slate-900',
    sidebarBorder: 'border-slate-800',
    sidebarActive: 'bg-violet-600/10',
    sidebarActiveText: 'text-violet-400',
    logoBg: 'bg-violet-600',
  },
  sky: {
    primary: 'bg-sky-600',
    primaryHover: 'hover:bg-sky-700',
    primaryLight: 'bg-sky-50',
    primaryText: 'text-sky-600',
    primaryBg: 'bg-sky-600',
    primaryRing: 'ring-sky-200',
    sidebarBg: 'bg-slate-900',
    sidebarBorder: 'border-slate-800',
    sidebarActive: 'bg-sky-600/10',
    sidebarActiveText: 'text-sky-400',
    logoBg: 'bg-sky-600',
  },
};

export function getThemeColors(theme: StoreTheme): ThemeColors {
  return themes[theme] || themes.indigo;
}
