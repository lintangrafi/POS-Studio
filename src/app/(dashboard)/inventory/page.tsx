'use client';

import { useEffect, useState } from 'react';
import { getProducts, addProduct, adjustStock, getCategories } from '@/actions/inventory-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Plus, Package, Search } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const handleAddProduct = async (formData: FormData) => {
    setFormError(null);
    const result = await addProduct({
      name: formData.get('name') as string,
      categoryId: Number(formData.get('categoryId')),
      price: Number(formData.get('price')),
      costPrice: Number(formData.get('costPrice')) || 0,
      stock: Number(formData.get('stock')) || 0,
      sku: (formData.get('sku') as string) || undefined,
      minStock: Number(formData.get('minStock')) || 0,
    });

    if (result.error) {
      setFormError(result.error);
    } else {
      setShowAddForm(false);
      loadData();
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventori</h1>
          <p className="text-sm text-slate-500">{products.length} produk terdaftar</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Produk Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleAddProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Nama *</label>
                <Input name="name" required placeholder="Nama produk" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Kategori *</label>
                <select name="categoryId" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Harga Jual *</label>
                <Input name="price" type="number" required min="1" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Harga Modal</label>
                <Input name="costPrice" type="number" min="0" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Stok Awal</label>
                <Input name="stock" type="number" min="0" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">SKU</label>
                <Input name="sku" placeholder="Opsional" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Min. Stok (alert)</label>
                <Input name="minStock" type="number" min="0" placeholder="0" />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <Button type="submit" variant="primary">Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Modal</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{product.name}</p>
                        {product.sku && <p className="text-xs text-slate-400">{product.sku}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(Number(product.price))}</td>
                    <td className="px-4 py-3 text-slate-500">{formatCurrency(Number(product.costPrice))}</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.stock === 0 ? 'danger' : product.stock <= (product.minStock || 0) ? 'warning' : 'default'}>
                        {product.stock}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.isMenuItem ? 'success' : 'default'}>
                        {product.isMenuItem ? 'Aktif' : 'Non-menu'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
