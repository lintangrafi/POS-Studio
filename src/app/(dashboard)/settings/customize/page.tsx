'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStoreSettings, updateStoreSettings, type StoreTheme } from '@/actions/store-actions';
import { Palette, Store, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEMES: { value: StoreTheme; label: string; color: string; ring: string }[] = [
  { value: 'indigo', label: 'Indigo', color: 'bg-indigo-600', ring: 'ring-indigo-300' },
  { value: 'emerald', label: 'Emerald', color: 'bg-emerald-600', ring: 'ring-emerald-300' },
  { value: 'rose', label: 'Rose', color: 'bg-rose-600', ring: 'ring-rose-300' },
  { value: 'amber', label: 'Amber', color: 'bg-amber-600', ring: 'ring-amber-300' },
  { value: 'violet', label: 'Violet', color: 'bg-violet-600', ring: 'ring-violet-300' },
  { value: 'sky', label: 'Sky', color: 'bg-sky-600', ring: 'ring-sky-300' },
];

export default function CustomizePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [storeName, setStoreName] = useState('');
  const [storeSubtitle, setStoreSubtitle] = useState('');
  const [logoInitial, setLogoInitial] = useState('');
  const [theme, setTheme] = useState<StoreTheme>('indigo');

  useEffect(() => {
    const load = async () => {
      const settings = await getStoreSettings();
      setStoreName(settings.storeName);
      setStoreSubtitle(settings.storeSubtitle);
      setLogoInitial(settings.logoInitial);
      setTheme(settings.theme);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateStoreSettings({
      storeName,
      storeSubtitle,
      logoInitial,
      theme,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Memuat...</div>;
  }

  const selectedTheme = THEMES.find((t) => t.value === theme);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kustomisasi</h1>
        <p className="text-sm text-slate-500">Ubah nama bisnis, logo, dan tema warna</p>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-xl bg-slate-900 p-5">
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold text-white', selectedTheme?.color)}>
              {logoInitial || 'S'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{storeName || 'Studio POS'}</p>
              <p className="text-xs text-slate-400">{storeSubtitle || 'Point of Sale'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Identitas Bisnis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nama Bisnis</label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Nama studio/bisnis Anda"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Subtitle</label>
              <Input
                value={storeSubtitle}
                onChange={(e) => setStoreSubtitle(e.target.value)}
                placeholder="Deskripsi singkat"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Inisial Logo</label>
              <Input
                value={logoInitial}
                onChange={(e) => setLogoInitial(e.target.value.slice(0, 2))}
                placeholder="S"
                maxLength={2}
                className="w-24"
              />
              <p className="text-xs text-slate-400">Maks. 2 karakter, ditampilkan di sidebar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema Warna
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  theme === t.value
                    ? `border-slate-900 ${t.ring} ring-2`
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className={cn('h-8 w-8 rounded-full', t.color)} />
                <span className="text-xs font-medium text-slate-700">{t.label}</span>
                {theme === t.value && (
                  <Check className="absolute right-1.5 top-1.5 h-4 w-4 text-slate-900" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
        {success && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" />
            Berhasil disimpan
          </span>
        )}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
  );
}
