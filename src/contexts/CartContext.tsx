'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Cart } from '@/lib/api';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  removeCartItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Stub implementations - cart functionality disabled
  const addToCart = async () => {
    // No-op
  };

  const updateCartItem = async () => {
    // No-op
  };

  const removeCartItem = async () => {
    // No-op
  };

  const clearCart = async () => {
    // No-op
  };

  const refreshCart = async () => {
    // No-op
  };

  return (
    <CartContext.Provider
      value={{
        cart: null,
        loading: false,
        itemCount: 0,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
