'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, Search, Eye, Ban, Trash2, Printer, X, Download } from 'lucide-react';
import { getInvoices, getInvoiceDetail, voidInvoice, deleteInvoice } from '@/actions/invoice-actions';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidForm, setShowVoidForm] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    const data = await getInvoices();
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { loadInvoices(); }, []);

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.invoiceNumber.toLowerCase().includes(q) || inv.customerName?.toLowerCase().includes(q);
    }
    return true;
  });

  const viewDetail = async (id: number) => {
    const detail = await getInvoiceDetail(id);
    setSelectedInvoice(detail);
    setShowDetail(true);
  };

  const handleVoid = async () => {
    if (!selectedInvoice || !voidReason.trim()) return;
    const result = await voidInvoice(selectedInvoice.id, voidReason);
    if (result.error) {
      alert(result.error);
    } else {
      setShowVoidForm(false);
      setVoidReason('');
      setShowDetail(false);
      loadInvoices();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('PERINGATAN: Invoice akan dihapus permanen. Lanjutkan?')) return;
    const result = await deleteInvoice(id);
    if (result.error) {
      alert(result.error);
    } else {
      setShowDetail(false);
      loadInvoices();
    }
  };

  const printReceipt = () => {
    if (!selectedInvoice) return;
    const inv = selectedInvoice;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;

    const itemsHtml = inv.items.map((item: any) =>
      `<tr><td>${item.productName}</td><td class="r">${item.quantity}x</td><td class="r">${fmt(item.unitPrice)}</td><td class="r">${fmt(item.subtotal)}</td></tr>`
    ).join('');

    const paymentsHtml = inv.payments.map((p: any) =>
      `<div class="row"><span>${p.method}</span><span>${fmt(p.amount)}</span></div>`
    ).join('');

    w.document.write(`<!DOCTYPE html><html><head><title>Struk ${inv.invoiceNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;padding:10mm;max-width:80mm;margin:0 auto}
.center{text-align:center}
.bold{font-weight:bold}
.line{border-top:1px dashed #000;margin:6px 0}
.row{display:flex;justify-content:space-between;margin:2px 0}
table{width:100%;border-collapse:collapse;margin:4px 0}
td{padding:2px 0;vertical-align:top}
.r{text-align:right}
h2{font-size:14px;margin-bottom:2px}
.small{font-size:10px;color:#666}
@media print{body{padding:0}button{display:none!important}}
</style></head><body>
<div class="center"><h2>Studio POS</h2><p class="small">Point of Sale</p></div>
<div class="line"></div>
<div class="row"><span>No:</span><span class="bold">${inv.invoiceNumber}</span></div>
<div class="row"><span>Tanggal:</span><span>${new Date(inv.createdAt).toLocaleString('id-ID')}</span></div>
<div class="row"><span>Kasir:</span><span>${inv.cashierName}</span></div>
${inv.customerName ? `<div class="row"><span>Customer:</span><span>${inv.customerName}</span></div>` : ''}
${inv.couponCode ? `<div class="row"><span>Kupon:</span><span>${inv.couponCode}</span></div>` : ''}
<div class="line"></div>
<table><thead><tr><td class="bold">Item</td><td class="r bold">Qty</td><td class="r bold">Harga</td><td class="r bold">Total</td></tr></thead><tbody>${itemsHtml}</tbody></table>
<div class="line"></div>
<div class="row"><span>Subtotal</span><span>${fmt(inv.subtotalAmount)}</span></div>
${inv.discountAmount > 0 ? `<div class="row"><span>Diskon</span><span>-${fmt(inv.discountAmount)}</span></div>` : ''}
<div class="row bold" style="font-size:14px"><span>TOTAL</span><span>${fmt(inv.totalAmount)}</span></div>
<div class="line"></div>
${paymentsHtml}
${inv.payments.reduce((s:number,p:any)=>s+p.amount,0) > inv.totalAmount ? `<div class="row"><span>Kembalian</span><span>${fmt(inv.payments.reduce((s:number,p:any)=>s+p.amount,0) - inv.totalAmount)}</span></div>` : ''}
<div class="line"></div>
<div class="center small" style="margin-top:8px"><p>Terima kasih atas kunjungan Anda!</p></div>
<div class="center" style="margin-top:12px"><button onclick="window.print()" style="padding:8px 16px;cursor:pointer">🖨️ Cetak</button>
<button onclick="printPDF()" style="padding:8px 16px;cursor:pointer;margin-left:4px">📄 PDF</button></div>
<script>function printPDF(){window.print()}</script>
</body></html>`);
    w.document.close();
  };

  function fmt(n: number) { return new Intl.NumberFormat('id-ID').format(n); }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoice</h1>
        <p className="text-sm text-slate-500">Daftar semua transaksi</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Cari invoice..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {['ALL', 'COMPLETED', 'VOID'].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {status === 'ALL' ? 'Semua' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FileText className="mb-2 h-8 w-8" /><p className="text-sm">Tidak ada invoice</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-500">
                    <th className="px-4 py-3">No. Invoice</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Pembayaran</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-indigo-600">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.createdAt)}</td>
                      <td className="px-4 py-3">{inv.customerName || 'Walk-in'}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(Number(inv.totalAmount))}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {inv.paymentMethods?.map((m: string, i: number) => (
                            <Badge key={i} variant="default">{m}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={inv.status === 'COMPLETED' ? 'success' : 'danger'}>{inv.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => viewDetail(inv.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="Detail">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetail && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetail(false)}>
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Detail Invoice</h2>
              <button onClick={() => setShowDetail(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">No. Invoice</span><p className="font-medium">{selectedInvoice.invoiceNumber}</p></div>
                <div><span className="text-slate-500">Status</span><p><Badge variant={selectedInvoice.status === 'COMPLETED' ? 'success' : 'danger'}>{selectedInvoice.status}</Badge></p></div>
                <div><span className="text-slate-500">Tanggal</span><p>{formatDate(selectedInvoice.createdAt)}</p></div>
                <div><span className="text-slate-500">Kasir</span><p>{selectedInvoice.cashierName}</p></div>
                {selectedInvoice.customerName && <div><span className="text-slate-500">Customer</span><p>{selectedInvoice.customerName}</p></div>}
                {selectedInvoice.couponCode && <div><span className="text-slate-500">Kupon</span><p className="font-medium text-indigo-600">{selectedInvoice.couponCode}</p></div>}
              </div>

              {selectedInvoice.voidReason && (
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-600">Alasan Void:</p>
                  <p className="text-sm text-red-700">{selectedInvoice.voidReason}</p>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-slate-700">Item</h3>
                <div className="space-y-1">
                  {selectedInvoice.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="ml-2 text-slate-400">{item.quantity}x {formatCurrency(item.unitPrice)}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(selectedInvoice.subtotalAmount)}</span></div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between"><span className="text-slate-500">Diskon</span><span className="text-red-500">-{formatCurrency(selectedInvoice.discountAmount)}</span></div>
                )}
                <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatCurrency(selectedInvoice.totalAmount)}</span></div>
              </div>

              {/* Payments */}
              <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
                <h3 className="font-medium text-slate-700">Pembayaran</h3>
                {selectedInvoice.payments.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between"><span className="text-slate-500">{p.method}</span><span>{formatCurrency(p.amount)}</span></div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" size="sm" onClick={printReceipt}>
                  <Printer className="mr-1 h-4 w-4" /> Cetak Struk
                </Button>
                {selectedInvoice.status === 'COMPLETED' && (
                  <Button variant="destructive" size="sm" onClick={() => setShowVoidForm(true)}>
                    <Ban className="mr-1 h-4 w-4" /> Void
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedInvoice.id)}>
                  <Trash2 className="mr-1 h-4 w-4" /> Hapus
                </Button>
              </div>

              {/* Void Form */}
              {showVoidForm && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-2 text-sm font-medium text-red-700">Alasan void:</p>
                  <Input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Masukkan alasan..." className="mb-2" />
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleVoid} disabled={!voidReason.trim()}>Konfirmasi Void</Button>
                    <Button variant="outline" size="sm" onClick={() => { setShowVoidForm(false); setVoidReason(''); }}>Batal</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
