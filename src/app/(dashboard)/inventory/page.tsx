'use client';

import { useEffect, useState } from 'react';
import { getProducts, addProduct, updateProduct, archiveProduct, restoreProduct, adjustStock, getCategories, addCategory, updateCategory, deleteCategory } from '@/actions/inventory-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Plus, Package, Search, Pencil, Trash2, Archive, RotateCcw, Tag, X } from 'lucide-react';

type Tab = 'products' | 'categories';

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catFormError, setCatFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([
      getProducts({ includeArchived: showArchived }),
      getCategories(),
    ]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [showArchived]);

  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  // ─── Product Handlers ──────────────────────────────────────────────────────

  const handleProductSubmit = async (formData: FormData) => {
    setFormError(null);
    const payload = {
      name: formData.get('name') as string,
      categoryId: Number(formData.get('categoryId')),
      price: Number(formData.get('price')),
      costPrice: Number(formData.get('costPrice')) || 0,
      stock: Number(formData.get('stock')) || 0,
      sku: (formData.get('sku') as string) || undefined,
      minStock: Number(formData.get('minStock')) || 0,
    };

    const result = editingProduct
      ? await updateProduct(editingProduct.id, payload)
      : await addProduct(payload);

    if (result.error) {
      setFormError(result.error);
    } else {
      setShowProductForm(false);
      setEditingProduct(null);
      loadData();
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Arsipkan produk ini?')) return;
    const result = await archiveProduct(id);
    if (!result.error) loadData();
  };

  const handleRestore = async (id: number) => {
    const result = await restoreProduct(id);
    if (!result.error) loadData();
  };

  const startEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowProductForm(true);
    setFormError(null);
  };

  // ─── Category Handlers ─────────────────────────────────────────────────────

  const handleCategorySubmit = async (formData: FormData) => {
    setCatFormError(null);
    const payload = {
      name: formData.get('catName') as string,
      type: formData.get('catType') as 'STUDIO' | 'FB',
      sortOrder: Number(formData.get('catSortOrder')) || 0,
    };

    const result = editingCategory
      ? await updateCategory(editingCategory.id, payload)
      : await addCategory(payload);

    if (result.error) {
      setCatFormError(result.error);
    } else {
      setShowCategoryForm(false);
      setEditingCategory(null);
      loadData();
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Hapus kategori ini? Pastikan tidak ada produk aktif di dalamnya.')) return;
    const result = await deleteCategory(id);
    if (result.error) {
      alert(result.error);
    } else {
      loadData();
    }
  };

  const startEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setShowCategoryForm(true);
    setCatFormError(null);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventori</h1>
          <p className="text-sm text-slate-500">{products.length} produk, {categories.length} kategori</p>
        </div>
        <div className="flex gap-2">
          {tab === 'products' && (
            <Button variant="primary" onClick={() => { setEditingProduct(null); setShowProductForm(true); setFormError(null); }}>
              <Plus className="mr-1 h-4 w-4" /> Tambah Produk
            </Button>
          )}
          {tab === 'categories' && (
            <Button variant="primary" onClick={() => { setEditingCategory(null); setShowCategoryForm(true); setCatFormError(null); }}>
              <Plus className="mr-1 h-4 w-4" /> Tambah Kategori
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setTab('products')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Package className="mr-2 inline h-4 w-4" /> Produk
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Tag className="mr-2 inline h-4 w-4" /> Kategori
        </button>
      </div>

      {/* ═══ PRODUCTS TAB ═══ */}
      {tab === 'products' && (
        <>
          {/* Product Form */}
          {showProductForm && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</CardTitle>
                <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </CardHeader>
              <CardContent>
                <form action={handleProductSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Nama *</label>
                    <Input name="name" required placeholder="Nama produk" defaultValue={editingProduct?.name || ''} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Kategori *</label>
                    <select name="categoryId" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={editingProduct?.categoryId || ''}>
                      <option value="">Pilih kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Harga Jual *</label>
                    <Input name="price" type="number" required min="1" placeholder="0" defaultValue={editingProduct ? Number(editingProduct.price) : ''} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Harga Modal</label>
                    <Input name="costPrice" type="number" min="0" placeholder="0" defaultValue={editingProduct ? Number(editingProduct.costPrice) : ''} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Stok</label>
                    <Input name="stock" type="number" min="0" placeholder="0" defaultValue={editingProduct?.stock ?? ''} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">SKU</label>
                    <Input name="sku" placeholder="Opsional" defaultValue={editingProduct?.sku || ''} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Min. Stok</label>
                    <Input name="minStock" type="number" min="0" placeholder="0" defaultValue={editingProduct?.minStock ?? ''} />
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
                    {formError && <p className="text-sm text-red-500">{formError}</p>}
                    <Button type="submit" variant="primary">{editingProduct ? 'Update' : 'Simpan'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowProductForm(false); setEditingProduct(null); }}>Batal</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded" />
              Tampilkan arsip
            </label>
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
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className={`hover:bg-slate-50 ${product.isArchived ? 'opacity-50' : ''}`}>
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
                          {product.isArchived ? (
                            <Badge variant="default">Arsip</Badge>
                          ) : (
                            <Badge variant={product.isMenuItem ? 'success' : 'default'}>
                              {product.isMenuItem ? 'Aktif' : 'Non-menu'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {!product.isArchived && (
                              <>
                                <button onClick={() => startEditProduct(product)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleArchive(product.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Arsipkan">
                                  <Archive className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {product.isArchived && (
                              <button onClick={() => handleRestore(product.id)} className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500" title="Kembalikan">
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-400">Tidak ada produk ditemukan</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══ CATEGORIES TAB ═══ */}
      {tab === 'categories' && (
        <>
          {/* Category Form */}
          {showCategoryForm && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</CardTitle>
                <button onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </CardHeader>
              <CardContent>
                <form action={handleCategorySubmit} className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Nama Kategori *</label>
                    <Input name="catName" required placeholder="Nama kategori" defaultValue={editingCategory?.name || ''} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Tipe *</label>
                    <select name="catType" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={editingCategory?.type || 'STUDIO'}>
                      <option value="STUDIO">Studio</option>
                      <option value="FB">Food & Beverage</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Urutan</label>
                    <Input name="catSortOrder" type="number" min="0" placeholder="0" defaultValue={editingCategory?.sortOrder ?? 0} />
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-3">
                    {catFormError && <p className="text-sm text-red-500">{catFormError}</p>}
                    <Button type="submit" variant="primary">{editingCategory ? 'Update' : 'Simpan'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}>Batal</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Categories List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-500">
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Tipe</th>
                      <th className="px-4 py-3">Urutan</th>
                      <th className="px-4 py-3">Jumlah Produk</th>
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categories.map((cat) => {
                      const productCount = products.filter((p) => p.categoryId === cat.id && !p.isArchived).length;
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{cat.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant={cat.type === 'STUDIO' ? 'default' : 'warning'}>{cat.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{cat.sortOrder}</td>
                          <td className="px-4 py-3 text-slate-500">{productCount} produk</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => startEditCategory(cat)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Edit">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Hapus">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {categories.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-400">Belum ada kategori</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
