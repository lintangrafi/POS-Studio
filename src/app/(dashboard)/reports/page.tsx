'use client';

import { useState, useEffect } from 'react';
import { getFinancialReport, getTopProducts, getChartData, type PeriodType } from '@/actions/report-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

type FilterPreset = 'today' | 'week' | 'month' | 'year' | 'custom';

function getPresetDates(preset: FilterPreset): { from: string; to: string; period: PeriodType } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { from: today, to: today, period: 'daily' };
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1);
      return { from: start.toISOString().split('T')[0], to: today, period: 'daily' };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString().split('T')[0], to: today, period: 'daily' };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: start.toISOString().split('T')[0], to: today, period: 'monthly' };
    }
    default:
      return { from: today, to: today, period: 'daily' };
  }
}

export default function ReportsPage() {
  const [preset, setPreset] = useState<FilterPreset>('month');
  const [from, setFrom] = useState(() => getPresetDates('month').from);
  const [to, setTo] = useState(() => getPresetDates('month').to);
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [report, setReport] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);

    const [rep, top, chart] = await Promise.all([
      getFinancialReport({ from: fromDate, to: toDate }),
      getTopProducts({ from: fromDate, to: toDate }),
      getChartData({ from: fromDate, to: toDate, period }),
    ]);
    setReport(rep);
    setTopProducts(top);
    setChartData(chart);
    setLoading(false);
  };

  useEffect(() => { loadReport(); }, []);

  const handlePreset = (p: FilterPreset) => {
    setPreset(p);
    if (p !== 'custom') {
      const dates = getPresetDates(p);
      setFrom(dates.from);
      setTo(dates.to);
      setPeriod(dates.period);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTooltipValue = (value: any) => formatCurrency(Number(value));

  const exportCSV = () => {
    if (!report) return;
    let csv = 'Laporan Keuangan\n';
    csv += `Periode: ${from} s/d ${to}\n\n`;
    csv += `Total Pendapatan,${report.totalRevenue}\n`;
    csv += `HPP (COGS),${report.totalCogs}\n`;
    csv += `Laba Kotor,${report.grossProfit}\n`;
    csv += `Total Pengeluaran,${report.totalExpenses}\n`;
    csv += `Pendapatan Lain,${report.totalIncomes}\n`;
    csv += `Laba Bersih,${report.netProfit}\n`;
    csv += `Total Transaksi,${report.totalOrders}\n\n`;
    csv += 'Metode Pembayaran\n';
    Object.entries(report.paymentBreakdown).forEach(([m, a]) => { csv += `${m},${a}\n`; });
    csv += '\nPengeluaran\nDeskripsi,Kategori,Tanggal,Jumlah\n';
    report.expenses.forEach((e: any) => { csv += `"${e.description}",${e.category},${new Date(e.date).toLocaleDateString('id-ID')},${e.amount}\n`; });
    csv += '\nPendapatan Lain\nDeskripsi,Kategori,Tanggal,Jumlah\n';
    report.incomes.forEach((i: any) => { csv += `"${i.description}",${i.category},${new Date(i.date).toLocaleDateString('id-ID')},${i.amount}\n`; });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-keuangan-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!report) return;
    const w = window.open('', '_blank');
    if (!w) return;

    const expenseRows = report.expenses.map((e: any) =>
      `<tr><td>${e.description}</td><td>${e.category}</td><td>${new Date(e.date).toLocaleDateString('id-ID')}</td><td class="r">${fmt(Number(e.amount))}</td></tr>`
    ).join('');

    const incomeRows = report.incomes.map((i: any) =>
      `<tr><td>${i.description}</td><td>${i.category}</td><td>${new Date(i.date).toLocaleDateString('id-ID')}</td><td class="r">${fmt(Number(i.amount))}</td></tr>`
    ).join('');

    w.document.write(`<!DOCTYPE html><html><head><title>Laporan Keuangan</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:12px;padding:20mm;color:#333}
h1{font-size:18px;margin-bottom:4px}
h2{font-size:14px;margin:16px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
.subtitle{color:#666;margin-bottom:16px}
.summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.summary-item{padding:8px;background:#f8f9fa;border-radius:4px}
.summary-item .label{font-size:11px;color:#666}
.summary-item .value{font-size:16px;font-weight:bold}
.green{color:#059669}.red{color:#dc2626}.blue{color:#4f46e5}
table{width:100%;border-collapse:collapse;margin:8px 0}
th,td{padding:6px 8px;text-align:left;border-bottom:1px solid #eee}
th{background:#f1f5f9;font-size:11px;font-weight:600}
.r{text-align:right}
@media print{body{padding:10mm}button{display:none!important}}
</style></head><body>
<h1>Laporan Keuangan</h1>
<p class="subtitle">Periode: ${from} s/d ${to}</p>
<div class="summary">
<div class="summary-item"><div class="label">Total Pendapatan</div><div class="value green">Rp ${fmt(report.totalRevenue)}</div></div>
<div class="summary-item"><div class="label">Laba Kotor</div><div class="value blue">Rp ${fmt(report.grossProfit)}</div></div>
<div class="summary-item"><div class="label">Total Pengeluaran</div><div class="value red">Rp ${fmt(report.totalExpenses)}</div></div>
<div class="summary-item"><div class="label">Laba Bersih</div><div class="value ${report.netProfit >= 0 ? 'blue' : 'red'}">Rp ${fmt(report.netProfit)}</div></div>
</div>
<p><strong>Total Transaksi:</strong> ${report.totalOrders} | <strong>HPP:</strong> Rp ${fmt(report.totalCogs)} | <strong>Pendapatan Lain:</strong> Rp ${fmt(report.totalIncomes)}</p>
<h2>Metode Pembayaran</h2>
<table><tr>${Object.entries(report.paymentBreakdown).map(([m, a]) => `<td><strong>${m}</strong><br>Rp ${fmt(a as number)}</td>`).join('')}</tr></table>
${report.expenses.length > 0 ? `<h2>Pengeluaran (${report.expenses.length})</h2><table><thead><tr><th>Deskripsi</th><th>Kategori</th><th>Tanggal</th><th class="r">Jumlah</th></tr></thead><tbody>${expenseRows}</tbody></table>` : ''}
${report.incomes.length > 0 ? `<h2>Pendapatan Lain (${report.incomes.length})</h2><table><thead><tr><th>Deskripsi</th><th>Kategori</th><th>Tanggal</th><th class="r">Jumlah</th></tr></thead><tbody>${incomeRows}</tbody></table>` : ''}
<div style="margin-top:20px;text-align:center"><button onclick="window.print()" style="padding:10px 20px;cursor:pointer;font-size:14px">🖨️ Cetak / Simpan PDF</button></div>
</body></html>`);
    w.document.close();
  };

  function fmt(n: number) { return new Intl.NumberFormat('id-ID').format(n); }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Laporan Keuangan</h1>
        <p className="text-sm text-slate-500">Analisis pendapatan dan pengeluaran</p>
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-1">
              {([
                ['today', 'Hari Ini'],
                ['week', 'Minggu Ini'],
                ['month', 'Bulan Ini'],
                ['year', 'Tahun Ini'],
                ['custom', 'Kustom'],
              ] as [FilterPreset, string][]).map(([key, label]) => (
                <Button
                  key={key}
                  variant={preset === key ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handlePreset(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {preset === 'custom' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Dari</label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Sampai</label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Grup</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PeriodType)}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                  >
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
              </>
            )}
            <Button variant="primary" onClick={loadReport} disabled={loading}>
              <Calendar className="mr-1 h-4 w-4" />
              {loading ? 'Memuat...' : 'Tampilkan'}
            </Button>
            {report && (
              <>
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="mr-1 h-4 w-4" /> Excel (CSV)
                </Button>
                <Button variant="outline" onClick={exportPDF}>
                  <Download className="mr-1 h-4 w-4" /> PDF
                </Button>
              </>
            )}
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

          {/* Revenue & Expense Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Grafik Pendapatan & Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={formatTooltipValue} />
                      <Legend />
                      <Bar dataKey="revenue" name="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="income" name="Pendapatan Lain" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profit Trend Chart */}
          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Tren Laba</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={formatTooltipValue} />
                      <Legend />
                      <Line type="monotone" dataKey="profit" name="Laba" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="revenue" name="Pendapatan" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Expense & Income Detail */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expenses List */}
            <Card>
              <CardHeader>
                <CardTitle>Pengeluaran ({report.expenses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {report.expenses.length === 0 ? (
                  <p className="text-sm text-slate-400">Tidak ada pengeluaran</p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {report.expenses.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{e.description}</p>
                          <p className="text-xs text-slate-400">{e.category} • {new Date(e.date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <p className="text-sm font-semibold text-red-600">-{formatCurrency(Number(e.amount))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Incomes List */}
            <Card>
              <CardHeader>
                <CardTitle>Pendapatan Lain ({report.incomes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {report.incomes.length === 0 ? (
                  <p className="text-sm text-slate-400">Tidak ada pendapatan lain</p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {report.incomes.map((i: any) => (
                      <div key={i.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{i.description}</p>
                          <p className="text-xs text-slate-400">{i.category} • {new Date(i.date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(Number(i.amount))}</p>
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
