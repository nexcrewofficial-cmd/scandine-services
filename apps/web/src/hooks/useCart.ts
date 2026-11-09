'use client';

import { useState, useEffect } from 'react';
import { IOrderItem } from '@scan-and-dine/shared-types';

export interface CartState {
  items: IOrderItem[];
  promoCode?: string;
  discountAmount: number;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartState>({
    items: [],
    discountAmount: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('scan_and_dine_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {
      // fallback to empty
    }
    setIsLoaded(true);
  }, []);

  const saveCart = (newCart: CartState) => {
    setCart(newCart);
    localStorage.setItem('scan_and_dine_cart', JSON.stringify(newCart));
  };

  const addItem = (item: IOrderItem) => {
    const existingIdx = cart.items.findIndex(
      (i) => i.menuItemId === item.menuItemId
    );

    let updatedItems = [...cart.items];
    if (existingIdx > -1) {
      updatedItems[existingIdx].quantity += item.quantity;
      updatedItems[existingIdx].itemTotal += item.itemTotal;
    } else {
      updatedItems.push(item);
    }

    saveCart({ ...cart, items: updatedItems });
  };

  const removeItem = (menuItemId: string) => {
    const updatedItems = cart.items.filter((i) => i.menuItemId !== menuItemId);
    saveCart({ ...cart, items: updatedItems });
  };

  const clearCart = () => {
    const empty: CartState = { items: [], discountAmount: 0 };
    saveCart(empty);
  };

  const subtotal = cart.items.reduce((sum, i) => sum + i.itemTotal, 0);
  const tax = Math.round(((subtotal - cart.discountAmount) * 0.05) * 100) / 100;
  const grandTotal = Math.max(0, subtotal - cart.discountAmount + (tax > 0 ? tax : 0));

  return {
    cart,
    isLoaded,
    addItem,
    removeItem,
    clearCart,
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    grandTotal: Math.round(grandTotal * 100) / 100,
    totalItems: cart.items.reduce((sum, i) => sum + i.quantity, 0),
  };
};
