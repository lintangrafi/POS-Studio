'use client';

import { usePosStore } from '@/store/use-pos-store';
import { formatCurrency, calculateDiscount, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag, Receipt, Tag } from 'lucide-react';
import { useState, useMemo } from 'react';
import { processCheckout, saveOpenBill } from '@/actions/pos-actions';
import { validateCoupon } from '@/actions/coupon-actions';
import { CheckoutDialog } from './CheckoutDialog';

interface CartPanelProps {
  isShiftOpen: boolean;
}

export function CartPanel({ isShiftOpen }: CartPanelProps) {
  const { cart, removeFromCart, updateQuantity, clearCart, discountType, discountValue, setDiscount, activeOpenBill } = usePosStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart]
  );

  const discountAmount = useMemo(
    () => calculateDiscount(subtotal, discountType, discountValue),
    [subtotal, discountType, discountValue]
  );

  const total = subtotal - discountAmount - (couponDiscount?.discountAmount || 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    const result = await validateCoupon(couponCode, subtotal);
    setCouponLoading(false);
    if (result.error) {
      setCouponError(result.error);
      setCouponDiscount(null);
    } else if (result.success && result.coupon) {
      setCouponDiscount({ code: result.coupon.code, discountAmount: result.coupon.discountAmount });
      setCouponError(null);
    }
  };

  const removeCoupon = () => {
    setCouponDiscount(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleSaveOpenBill = async () => {
    if (!cart.length) return;
    setSaving(true);
    setError(null);

    const result = await saveOpenBill({
      billId: activeOpenBill?.id,
      items: cart.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price),
      })),
      subtotalAmount: subtotal,
      discountType,
      discountValue,
      discountAmount,
      totalAmount: total,
    });

    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      clearCart();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            <ShoppingBag className="mr-2 inline-block h-4 w-4" />
            Keranjang
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700">
              Hapus semua
            </button>
          )}
        </div>
        {activeOpenBill && (
          <p className="mt-1 text-xs text-indigo-600">
            Open Bill: {activeOpenBill.billNumber}
          </p>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <Receipt className="mb-2 h-10 w-10" />
            <p className="text-sm">Keranjang kosong</p>
            <p className="text-xs">Pilih produk untuk memulai</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(Number(item.price))}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    aria-label={`Kurangi jumlah ${item.name}`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium" aria-label={`Jumlah: ${item.quantity}`}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    aria-label={`Tambah jumlah ${item.name}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Hapus ${item.name} dari keranjang`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discount & Totals */}
      {cart.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* Discount Input */}
          <div className="flex items-center gap-2">
            <select
              value={discountType}
              onChange={(e) => setDiscount(e.target.value as 'FIXED' | 'PERCENT', discountValue)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
            >
              <option value="FIXED">Rp</option>
              <option value="PERCENT">%</option>
            </select>
            <Input
              type="number"
              placeholder="Diskon"
              value={discountValue || ''}
              onChange={(e) => setDiscount(discountType, Number(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>

          {/* Coupon Input */}
          <div className="space-y-1">
            {couponDiscount ? (
              <div className="flex items-center justify-between rounded-md bg-indigo-50 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700">{couponDiscount.code}</span>
                  <span className="text-xs text-indigo-500">(-{formatCurrency(couponDiscount.discountAmount)})</span>
                </div>
                <button onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700">Hapus</button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="Kode kupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="h-8 text-xs flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                />
                <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="h-8 text-xs">
                  {couponLoading ? '...' : 'Pakai'}
                </Button>
              </div>
            )}
            {couponError && <p className="text-xs text-red-500">{couponError}</p>}
          </div>

          {/* Summary */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {couponDiscount && (
              <div className="flex justify-between text-indigo-500">
                <span>Kupon ({couponDiscount.code})</span>
                <span>-{formatCurrency(couponDiscount.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-1 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSaveOpenBill}
              disabled={saving || !cart.length}
            >
              {saving ? 'Menyimpan...' : 'Simpan Bill'}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => setShowCheckout(true)}
              disabled={!isShiftOpen || !cart.length}
            >
              Bayar
            </Button>
          </div>

          {!isShiftOpen && (
            <p className="text-center text-xs text-amber-600">Buka shift untuk checkout</p>
          )}
        </div>
      )}

      {/* Checkout Dialog */}
      {showCheckout && (
        <CheckoutDialog
          open={showCheckout}
          onClose={() => setShowCheckout(false)}
          subtotal={subtotal}
          discountType={discountType}
          discountValue={discountValue}
          discountAmount={discountAmount + (couponDiscount?.discountAmount || 0)}
          total={total}
          couponCode={couponDiscount?.code}
        />
      )}
    </div>
  );
}
