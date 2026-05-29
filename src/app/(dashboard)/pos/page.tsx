import { getAnyOpenShift } from '@/actions/shift-actions';
import { getPosData } from '@/actions/pos-actions';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { Badge } from '@/components/ui/badge';

export default async function POSPage() {
  const [openShift, { categories, products }] = await Promise.all([
    getAnyOpenShift(),
    getPosData(),
  ]);

  const isShiftOpen = !!openShift;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 lg:h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kasir</h1>
          <p className="text-sm text-slate-500">Transaksi cepat dengan split payment</p>
        </div>
        <Badge variant={isShiftOpen ? 'success' : 'danger'}>
          {isShiftOpen ? `Shift Aktif — ${openShift?.user?.name || ''}` : 'Shift Tertutup'}
        </Badge>
      </div>

      {!isShiftOpen && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Tidak ada shift aktif. Buka shift terlebih dahulu untuk melakukan transaksi.
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Product Grid */}
        <div className="flex-1 overflow-hidden p-4">
          <ProductGrid categories={categories} products={products} />
        </div>

        {/* Cart Sidebar */}
        <div className="w-full max-w-sm border-l border-slate-100 lg:w-96">
          <CartPanel isShiftOpen={isShiftOpen} />
        </div>
      </div>
    </div>
  );
}
