import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  categoryId: number;
  sku?: string | null;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ActiveOpenBill {
  id: number;
  billNumber: string;
  customerName?: string;
  note?: string;
  downPayment?: number;
}

interface PosState {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setCart: (items: CartItem[]) => void;
  clearCart: () => void;

  // Open Bill
  activeOpenBill: ActiveOpenBill | null;
  setActiveOpenBill: (bill: ActiveOpenBill | null) => void;

  // Filters
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Discount
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  setDiscount: (type: 'FIXED' | 'PERCENT', value: number) => void;
  clearDiscount: () => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      cart: [],
      activeOpenBill: null,
      selectedCategoryId: null,
      searchQuery: '',
      discountType: 'FIXED',
      discountValue: 0,

      addToCart: (product) => set((state) => {
        const existing = state.cart.find((item) => item.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) return state;
          return {
            cart: state.cart.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          };
        }
        if (product.stock <= 0) return state;
        return { cart: [...state.cart, { ...product, quantity: 1 }] };
      }),

      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== productId),
      })),

      updateQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) {
          return { cart: state.cart.filter((item) => item.id !== productId) };
        }
        const product = state.cart.find((item) => item.id === productId);
        if (product && quantity > product.stock) return state;
        return {
          cart: state.cart.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        };
      }),

      setCart: (items) => set({ cart: items }),
      clearCart: () => set({
        cart: [],
        activeOpenBill: null,
        discountType: 'FIXED',
        discountValue: 0,
        searchQuery: '',
        selectedCategoryId: null,
      }),

      setActiveOpenBill: (bill) => set({ activeOpenBill: bill }),

      setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      setDiscount: (type, value) => set({ discountType: type, discountValue: value }),
      clearDiscount: () => set({ discountType: 'FIXED', discountValue: 0 }),
    }),
    {
      name: 'pos-cart-storage',
      partialize: (state) => ({
        cart: state.cart,
        activeOpenBill: state.activeOpenBill,
        discountType: state.discountType,
        discountValue: state.discountValue,
      }),
    }
  )
);
