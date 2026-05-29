import { requireAdmin } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { getFinancialReport, getTopProducts } from '@/actions/report-actions';
import { getLowStockProducts } from '@/actions/inventory-actions';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  await requireAdmin();

  // Today's report
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [report, topProducts, lowStock] = await Promise.all([
    getFinancialReport({ from: today, to: tomorrow }),
    getTopProducts({ from: today, to: tomorrow, limit: 5 }),
    getLowStockProducts(),
  ]);

  const stats = [
    { label: 'Pendapatan Hari Ini', value: formatCurrency(report.totalRevenue), icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Total Transaksi', value: report.totalOrders.toString(), icon: ShoppingCart, color: 'text-indigo-600' },
    { label: 'Laba Kotor', value: formatCurrency(report.grossProfit), icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Stok Rendah', value: lowStock.length.toString(), icon: Package, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan aktivitas hari ini</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada transaksi hari ini</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, i) => (
                  <div key={product.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{product.productName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{product.qty} terjual</p>
                      <p className="text-xs text-slate-400">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle>Peringatan Stok Rendah</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-400">Semua stok aman</p>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 8).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{product.name}</span>
                    <Badge variant={product.stock === 0 ? 'danger' : 'warning'}>
                      Stok: {product.stock}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Pembayaran Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(report.paymentBreakdown).map(([method, amount]) => (
              <div key={method} className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-500">{method}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(amount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
