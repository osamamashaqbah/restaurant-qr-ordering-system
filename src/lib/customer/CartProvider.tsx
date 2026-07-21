"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "cart_items";

export type CartItem = {
  menuItemId: string;
  nameEn: string;
  nameAr: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  notes: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "notes">, quantity?: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  total: number;
  count: number;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        // Hydrating client-only sessionStorage after mount to avoid an
        // SSR/CSR mismatch — see LocaleProvider for the same rationale.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(raw));
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: Math.min(i.quantity + quantity, 50) }
            : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(quantity, 50), notes: "" }];
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.menuItemId !== menuItemId);
      return prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: Math.min(quantity, 50) } : i
      );
    });
  };

  const updateNotes = (menuItemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, notes: notes.slice(0, 300) } : i))
    );
  };

  const removeItem = (menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setItems([]);
    window.sessionStorage.removeItem(STORAGE_KEY);
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, updateNotes, removeItem, clearCart, total, count, hydrated }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
