'use client';

import { useState, useEffect } from 'react';
import { addExpense, getExpenses, updateExpense, deleteExpense, addIncome, getIncomes, updateIncome, deleteIncome } from '@/actions/expense-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, TrendingDown, TrendingUp } from 'lucide-react';

type Tab = 'expenses' | 'incomes';
type ExpenseCategory = 'SUPPLIES' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER';
type IncomeCategory = 'SERVICE' | 'REFUND' | 'OTHER';
type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'SUPPLIES', label: 'Perlengkapan' },
  { value: 'UTILITIES', label: 'Utilitas' },
  { value: 'MAINTENANCE', label: 'Perawatan' },
  { value: 'OTHER', label: 'Lainnya' },
];

const INCOME_CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: 'SERVICE', label: 'Jasa' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'OTHER', label: 'Lainnya' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'TRANSFER', label: 'Transfer' },
];

export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>('expenses');
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [incomesList, setIncomesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Date range - default to current month
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    setLoading(true);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);

    const [exp, inc] = await Promise.all([
      getExpenses({ from: fromDate, to: toDate }),
      getIncomes({ from: fromDate, to: toDate }),
    ]);
    setExpensesList(exp);
    setIncomesList(inc);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const totalExpenses = expensesList.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncomes = incomesList.reduce((s, i) => s + Number(i.amount), 0);

  const handleSubmit = async (formData: FormData) => {
    setFormError(null);
    const payload = {
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      category: formData.get('category') as any,
      paymentMethod: formData.get('paymentMethod') as PaymentMethod,
      date: formData.get('date') as string,
      notes: (formData.get('notes') as string) || undefined,
    };

    let result;
    if (tab === 'expenses') {
      result = editing
        ? await updateExpense(editing.id, payload)
        : await addExpense(payload);
    } else {
      result = editing
        ? await updateIncome(editing.id, payload)
        : await addIncome(payload);
    }

    if (result.error) {
      setFormError(result.error);
    } else {
      setShowForm(false);
      setEditing(null);
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus item ini?')) return;
    const result = tab === 'expenses' ? await deleteExpense(id) : await deleteIncome(id);
    if (!result.error) loadData();
    else alert(result.error);
  };

  const startEdit = (item: any) => {
    setEditing(item);
    setShowForm(true);
    setFormError(null);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengeluaran & Pendapatan</h1>
          <p className="text-sm text-slate-500">Kelola keuangan non-transaksi</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setShowForm(true); setFormError(null); }}>
          <Plus className="mr-1 h-4 w-4" /> Tambah {tab === 'expenses' ? 'Pengeluaran' : 'Pendapatan'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 p-2"><TrendingDown className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-xs text-slate-500">Total Pengeluaran</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs text-slate-500">Total Pendapatan Lain</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalIncomes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <Button variant="primary" onClick={loadData}>Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button onClick={() => { setTab('expenses'); setShowForm(false); }} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'expenses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <TrendingDown className="mr-2 inline h-4 w-4" /> Pengeluaran ({expensesList.length})
        </button>
        <button onClick={() => { setTab('incomes'); setShowForm(false); }} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'incomes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <TrendingUp className="mr-2 inline h-4 w-4" /> Pendapatan ({incomesList.length})
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editing ? 'Edit' : 'Tambah'} {tab === 'expenses' ? 'Pengeluaran' : 'Pendapatan'}</CardTitle>
            <button onClick={() => { setShowForm(false); setEditing(null); }}><X className="h-5 w-5 text-slate-400" /></button>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Deskripsi *</label>
                <Input name="description" required placeholder="Deskripsi" defaultValue={editing?.description || ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Jumlah (Rp) *</label>
                <Input name="amount" type="number" required min="1" placeholder="0" defaultValue={editing ? Number(editing.amount) : ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Kategori *</label>
                <select name="category" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={editing?.category || ''}>
                  <option value="">Pilih</option>
                  {(tab === 'expenses' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Metode Bayar *</label>
                <select name="paymentMethod" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={editing?.paymentMethod || 'CASH'}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Tanggal *</label>
                <Input name="date" type="date" required defaultValue={editing ? new Date(editing.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Catatan</label>
                <Input name="notes" placeholder="Opsional" defaultValue={editing?.notes || ''} />
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

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jumlah</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(tab === 'expenses' ? expensesList : incomesList).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.description}</p>
                      {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{item.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.paymentMethod}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${tab === 'expenses' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {tab === 'expenses' ? '-' : '+'}{formatCurrency(Number(item.amount))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(item)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(tab === 'expenses' ? expensesList : incomesList).length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                Belum ada {tab === 'expenses' ? 'pengeluaran' : 'pendapatan'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
