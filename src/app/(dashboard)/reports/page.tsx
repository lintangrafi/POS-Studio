'use client';

import { useState, useEffect } from 'react';
import { getFinancialReport, getTopProducts } from '@/actions/report-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1); // First of month
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1); // Include the end date

    const [rep, top] = await Promise.all([
      getFinancialReport({ from: fromDate, to: toDate }),
      getTopProducts({ from: fromDate, to: toDate }),
    ]);
    setReport(rep);
    setTopProducts(top);
    setLoading(false);
  };

  useEffect(() => { loadReport(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Laporan Keuangan</h1>
        <p className="text-sm text-slate-500">Analisis pendapatan dan pengeluaran</p>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Dari</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Sampai</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <Button variant="primary" onClick={loadReport} disabled={loading}>
              {loading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Pendapatan</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(report.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Laba Kotor</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(report.grossProfit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-50 p-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Pengeluaran</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(report.totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Laba Bersih</p>
                    <p className={`text-lg font-bold ${report.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                      {formatCurrency(report.netProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Payment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(report.paymentBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{method}</span>
                      <span className="text-sm font-semibold">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Produk Terlaris</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-slate-400">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((p, i) => (
                      <div key={p.productId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium">
                            {i + 1}
                          </span>
                          <span className="text-sm">{p.productName}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{p.qty} pcs</p>
                          <p className="text-xs text-slate-400">{formatCurrency(p.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Total Transaksi</p>
              <p className="text-2xl font-bold text-slate-900">{report.totalOrders}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">HPP (COGS)</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(report.totalCogs)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Pendapatan Lain</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(report.totalIncomes)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
