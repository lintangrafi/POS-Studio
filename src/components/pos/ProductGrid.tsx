'use client';

import { usePosStore, type Product } from '@/store/use-pos-store';
import { formatCurrency, cn } from '@/lib/utils';
import { Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ProductGridProps {
  categories: { id: number; name: string; type: string }[];
  products: (Product & { category?: { name: string } | null })[];
}

export function ProductGrid({ categories, products }: ProductGridProps) {
  const { selectedCategoryId, setSelectedCategoryId, searchQuery, setSearchQuery, addToCart, cart } = usePosStore();

  const filteredProducts = products.filter((p) => {
    if (selectedCategoryId && p.categoryId !== selectedCategoryId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Cari produk atau SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={cn(
            'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            !selectedCategoryId
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              selectedCategoryId === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-slate-400">
            <Package className="mb-2 h-8 w-8" />
            <p className="text-sm">Tidak ada produk ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const inCart = cart.find((item) => item.id === product.id);
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  disabled={isOutOfStock}
                  aria-label={`${product.name} - ${formatCurrency(Number(product.price))}${isOutOfStock ? ' (Habis)' : `, stok: ${product.stock}`}`}
                  className={cn(
                    'relative flex flex-col rounded-xl border p-3 text-left transition-all',
                    isOutOfStock
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md active:scale-[0.98]',
                    inCart && !isOutOfStock && 'border-indigo-300 ring-1 ring-indigo-200'
                  )}
                >
                  {/* Quantity badge */}
                  {inCart && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {inCart.quantity}
                    </span>
                  )}

                  <p className="mb-1 text-sm font-medium text-slate-800 line-clamp-2">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.category?.name}</p>
                  <div className="mt-auto pt-2">
                    <p className="text-sm font-semibold text-indigo-600">
                      {formatCurrency(Number(product.price))}
                    </p>
                    <Badge variant={isOutOfStock ? 'danger' : product.stock <= 5 ? 'warning' : 'default'} className="mt-1">
                      Stok: {product.stock}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
