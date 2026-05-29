'use client';

import { useActionState, useEffect, useState } from 'react';
import { openShiftAction, closeShiftAction, getMyOpenShift, getShiftHistory } from '@/actions/shift-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ShiftPage() {
  const [openState, openAction, openPending] = useActionState(openShiftAction, null);
  const [closeState, closeAction, closePending] = useActionState(closeShiftAction, null);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [shift, shifts] = await Promise.all([getMyOpenShift(), getShiftHistory()]);
    setActiveShift(shift);
    setHistory(shifts);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (openState?.success || closeState?.success) loadData();
  }, [openState, closeState]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manajemen Shift</h1>
        <p className="text-sm text-slate-500">Buka dan tutup shift kasir</p>
      </div>

      {/* Active Shift or Open Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            {activeShift ? 'Shift Aktif' : 'Buka Shift Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeShift ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Mulai</p>
                  <p className="text-sm font-medium">{formatDate(activeShift.startTime)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Kas Awal</p>
                  <p className="text-sm font-medium">{formatCurrency(Number(activeShift.openingCash))}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-600">Status</p>
                  <p className="text-sm font-semibold text-emerald-700">AKTIF</p>
                </div>
              </div>

              <form action={closeAction} className="space-y-3 border-t border-slate-100 pt-4">
                <div className="space-y-2">
                  <label htmlFor="closingCash" className="text-sm font-medium text-slate-700">
                    Kas Akhir (hitung fisik)
                  </label>
                  <Input id="closingCash" name="closingCash" type="number" placeholder="0" required min="0" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="note" className="text-sm font-medium text-slate-700">
                    Catatan (opsional)
                  </label>
                  <Input id="note" name="note" placeholder="Catatan shift..." />
                </div>
                {closeState?.error && <p className="text-sm text-red-500">{closeState.error}</p>}
                {closeState?.success && (
                  <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                    Shift ditutup. Selisih kas: {formatCurrency(closeState.difference ?? 0)}
                  </div>
                )}
                <Button type="submit" variant="destructive" disabled={closePending}>
                  <Square className="mr-2 h-4 w-4" />
                  {closePending ? 'Menutup...' : 'Tutup Shift'}
                </Button>
              </form>
            </div>
          ) : (
            <form action={openAction} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="openingCash" className="text-sm font-medium text-slate-700">
                  Kas Awal
                </label>
                <Input id="openingCash" name="openingCash" type="number" placeholder="0" min="0" defaultValue="0" />
              </div>
              {openState?.error && <p className="text-sm text-red-500">{openState.error}</p>}
              <Button type="submit" variant="primary" disabled={openPending}>
                <Play className="mr-2 h-4 w-4" />
                {openPending ? 'Membuka...' : 'Buka Shift'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Shift History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Shift</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada riwayat shift</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-4">Kasir</th>
                    <th className="pb-2 pr-4">Mulai</th>
                    <th className="pb-2 pr-4">Selesai</th>
                    <th className="pb-2 pr-4">Kas Awal</th>
                    <th className="pb-2 pr-4">Kas Akhir</th>
                    <th className="pb-2 pr-4">Selisih</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map((shift: any) => (
                    <tr key={shift.id}>
                      <td className="py-2.5 pr-4 font-medium">{shift.user?.name || '-'}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{formatDate(shift.startTime)}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{shift.endTime ? formatDate(shift.endTime) : '-'}</td>
                      <td className="py-2.5 pr-4">{formatCurrency(Number(shift.openingCash))}</td>
                      <td className="py-2.5 pr-4">{shift.closingCash ? formatCurrency(Number(shift.closingCash)) : '-'}</td>
                      <td className="py-2.5 pr-4">
                        {shift.cashDifference != null ? (
                          <span className={Number(shift.cashDifference) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {formatCurrency(Number(shift.cashDifference))}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2.5">
                        <Badge variant={shift.status === 'OPEN' ? 'success' : 'default'}>
                          {shift.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
