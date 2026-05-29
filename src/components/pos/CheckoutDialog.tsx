'use client';

import { useState, useEffect, useRef } from 'react';
import { usePosStore } from '@/store/use-pos-store';
import { processCheckout } from '@/actions/pos-actions';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, X, CreditCard, Banknote, Smartphone } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  discountAmount: number;
  total: number;
}

const METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH', label: 'Tunai', icon: Banknote },
  { value: 'QRIS', label: 'QRIS', icon: Smartphone },
  { value: 'TRANSFER', label: 'Transfer', icon: CreditCard },
];

export function CheckoutDialog({ open, onClose, subtotal, discountType, discountValue, discountAmount, total }: CheckoutDialogProps) {
  const { cart, clearCart } = usePosStore();
  const [payments, setPayments] = useState<PaymentEntry[]>([{ method: 'CASH', amount: total }]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; invoiceNumber?: string; change?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset payment amount when total changes
  useEffect(() => {
    if (open && !result) {
      setPayments([{ method: 'CASH', amount: total }]);
    }
  }, [open, total, result]);

  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const change = paymentTotal - total;
  const isValid = paymentTotal >= total && payments.every((p) => p.amount > 0);

  const addPaymentMethod = () => {
    const remaining = Math.max(0, total - paymentTotal);
    setPayments([...payments, { method: 'QRIS', amount: remaining }]);
  };

  const removePaymentMethod = (index: number) => {
    if (payments.length <= 1) return;
    const updated = payments.filter((_, i) => i !== index);
    // Auto-adjust first payment to cover remaining
    const otherTotal = updated.slice(1).reduce((sum, p) => sum + p.amount, 0);
    updated[0] = { ...updated[0], amount: Math.max(0, total - otherTotal) };
    setPayments(updated);
  };

  const updatePayment = (index: number, field: keyof PaymentEntry, value: any) => {
    setPayments(payments.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleCheckout = async () => {
    if (!isValid) return;
    setProcessing(true);
    setError(null);

    const res = await processCheckout({
      items: cart.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price),
      })),
      payments: payments.filter((p) => p.amount > 0),
      subtotalAmount: subtotal,
      discountType,
      discountValue,
      discountAmount,
      totalAmount: total,
    });

    setProcessing(false);

    if (res.error) {
      setError(res.error);
    } else {
      setResult({ success: true, invoiceNumber: res.invoiceNumber, change: res.change });
    }
  };

  const handleDone = () => {
    clearCart();
    setResult(null);
    setError(null);
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !processing) {
      if (result?.success) {
        handleDone();
      } else {
        onClose();
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl focus:outline-none">
          {/* Success State */}
          {result?.success ? (
            <div className="flex flex-col items-center p-8 text-center">
              <CheckCircle className="mb-4 h-16 w-16 text-emerald-500" />
              <Dialog.Title className="mb-1 text-xl font-bold text-slate-900">
                Transaksi Berhasil
              </Dialog.Title>
              <Dialog.Description className="mb-2 text-sm text-slate-500">
                {result.invoiceNumber}
              </Dialog.Description>
              {(result.change ?? 0) > 0 && (
                <p className="mb-4 text-lg font-semibold text-indigo-600">
                  Kembalian: {formatCurrency(result.change!)}
                </p>
              )}
              <Button variant="primary" onClick={handleDone} className="w-full">
                Selesai
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Pembayaran
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="rounded-lg p-1 hover:bg-slate-100"
                    aria-label="Tutup dialog pembayaran"
                    disabled={processing}
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </Dialog.Close>
              </div>

              <Dialog.Description className="sr-only">
                Form pembayaran untuk menyelesaikan transaksi
              </Dialog.Description>

              {/* Content */}
              <div className="space-y-4 p-5">
                {/* Total */}
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-500">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</p>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={payment.method}
                        onChange={(e) => updatePayment(index, 'method', e.target.value)}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        aria-label={`Metode pembayaran ${index + 1}`}
                      >
                        {METHODS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        value={payment.amount || ''}
                        onChange={(e) => updatePayment(index, 'amount', Number(e.target.value) || 0)}
                        placeholder="Jumlah"
                        className="flex-1"
                        aria-label={`Jumlah pembayaran ${index + 1}`}
                      />
                      {payments.length > 1 && (
                        <button
                          onClick={() => removePaymentMethod(index)}
                          className="rounded-lg p-2 text-red-400 hover:bg-red-50"
                          aria-label={`Hapus metode pembayaran ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={addPaymentMethod}
                    className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                  >
                    + Split Payment
                  </button>
                </div>

                {/* Change */}
                {change > 0 && (
                  <div className="rounded-lg bg-emerald-50 px-4 py-2 text-center">
                    <span className="text-sm text-emerald-700">Kembalian: {formatCurrency(change)}</span>
                  </div>
                )}

                {change < 0 && (
                  <div className="rounded-lg bg-red-50 px-4 py-2 text-center">
                    <span className="text-sm text-red-600">Kurang: {formatCurrency(Math.abs(change))}</span>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-2" role="alert">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={onClose} className="flex-1" disabled={processing}>
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCheckout}
                    className="flex-1"
                    disabled={!isValid || processing}
                  >
                    {processing ? 'Memproses...' : 'Konfirmasi'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
