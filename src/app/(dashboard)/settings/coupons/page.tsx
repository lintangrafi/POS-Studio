'use client';

import { useState, useEffect } from 'react';
import { getCoupons, addCoupon, updateCoupon, deleteCoupon } from '@/actions/coupon-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react';

export default function CouponsPage() {
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getCoupons();
    setCouponsList(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: FormData) => {
    setFormError(null);
    const payload = {
      code: formData.get('code') as string,
      description: (formData.get('description') as string) || undefined,
      discountType: formData.get('discountType') as 'FIXED' | 'PERCENT',
      discountValue: Number(formData.get('discountValue')),
      minPurchase: Number(formData.get('minPurchase')) || 0,
      maxDiscount: Number(formData.get('maxDiscount')) || undefined,
      usageLimit: Number(formData.get('usageLimit')) || undefined,
      validFrom: (formData.get('validFrom') as string) || undefined,
      validUntil: (formData.get('validUntil') as string) || undefined,
    };

    const result = editing
      ? await updateCoupon(editing.id, payload)
      : await addCoupon(payload);

    if (result.error) {
      setFormError(result.error);
    } else {
      setShowForm(false);
      setEditing(null);
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kupon ini?')) return;
    const result = await deleteCoupon(id);
    if (result.error) alert(result.error);
    else loadData();
  };

  const toggleActive = async (coupon: any) => {
    await updateCoupon(coupon.id, { isActive: !coupon.isActive });
    loadData();
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kupon Diskon</h1>
          <p className="text-sm text-slate-500">Kelola kupon untuk kasir</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setShowForm(true); setFormError(null); }}>
          <Plus className="mr-1 h-4 w-4" /> Buat Kupon
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editing ? 'Edit Kupon' : 'Buat Kupon Baru'}</CardTitle>
            <button onClick={() => { setShowForm(false); setEditing(null); }}><X className="h-5 w-5 text-slate-400" /></button>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Kode Kupon *</label>
                <Input name="code" required placeholder="DISKON20" defaultValue={editing?.code || ''} className="uppercase" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Deskripsi</label>
                <Input name="description" placeholder="Opsional" defaultValue={editing?.description || ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Tipe Diskon *</label>
                <select name="discountType" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={editing?.discountType || 'FIXED'}>
                  <option value="FIXED">Nominal (Rp)</option>
                  <option value="PERCENT">Persentase (%)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Nilai Diskon *</label>
                <Input name="discountValue" type="number" required min="1" placeholder="0" defaultValue={editing ? Number(editing.discountValue) : ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Min. Pembelian</label>
                <Input name="minPurchase" type="number" min="0" placeholder="0" defaultValue={editing ? Number(editing.minPurchase) : ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Maks. Diskon (untuk %)</label>
                <Input name="maxDiscount" type="number" min="0" placeholder="Tanpa batas" defaultValue={editing?.maxDiscount ? Number(editing.maxDiscount) : ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Batas Penggunaan</label>
                <Input name="usageLimit" type="number" min="0" placeholder="Tanpa batas" defaultValue={editing?.usageLimit || ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Berlaku Dari</label>
                <Input name="validFrom" type="date" defaultValue={editing?.validFrom ? new Date(editing.validFrom).toISOString().split('T')[0] : ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Berlaku Sampai</label>
                <Input name="validUntil" type="date" defaultValue={editing?.validUntil ? new Date(editing.validUntil).toISOString().split('T')[0] : ''} />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <Button type="submit" variant="primary">{editing ? 'Update' : 'Simpan'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Coupons List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Diskon</th>
                  <th className="px-4 py-3">Min. Beli</th>
                  <th className="px-4 py-3">Penggunaan</th>
                  <th className="px-4 py-3">Berlaku</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {couponsList.map((coupon) => {
                  const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                  const isLimitReached = coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;
                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-indigo-500" />
                          <span className="font-mono font-medium text-slate-800">{coupon.code}</span>
                        </div>
                        {coupon.description && <p className="mt-0.5 text-xs text-slate-400">{coupon.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {coupon.discountType === 'PERCENT'
                          ? `${Number(coupon.discountValue)}%${coupon.maxDiscount ? ` (maks ${formatCurrency(Number(coupon.maxDiscount))})` : ''}`
                          : formatCurrency(Number(coupon.discountValue))
                        }
                      </td>
                      <td className="px-4 py-3 text-slate-500">{Number(coupon.minPurchase) > 0 ? formatCurrency(Number(coupon.minPurchase)) : '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : '/∞'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString('id-ID') : '∞'}
                        {' - '}
                        {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('id-ID') : '∞'}
                      </td>
                      <td className="px-4 py-3">
                        {!coupon.isActive ? <Badge variant="default">Nonaktif</Badge>
                          : isExpired ? <Badge variant="danger">Kadaluarsa</Badge>
                          : isLimitReached ? <Badge variant="warning">Habis</Badge>
                          : <Badge variant="success">Aktif</Badge>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => toggleActive(coupon)} className="rounded p-1 text-slate-400 hover:bg-slate-100" title={coupon.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                            {coupon.isActive ? '⏸' : '▶'}
                          </button>
                          <button onClick={() => { setEditing(coupon); setShowForm(true); setFormError(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(coupon.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Hapus">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {couponsList.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">Belum ada kupon</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
