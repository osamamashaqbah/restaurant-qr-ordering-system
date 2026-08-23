import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart, type CartItem } from "./CartProvider";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

const hummus: Omit<CartItem, "quantity" | "notes"> = {
  menuItemId: "hummus-1",
  nameEn: "Hummus",
  nameAr: "حمص",
  price: 3.5,
  imageUrl: null,
};

const kebab: Omit<CartItem, "quantity" | "notes"> = {
  menuItemId: "kebab-1",
  nameEn: "Beef Kebab",
  nameAr: "كباب لحم",
  price: 9.5,
  imageUrl: null,
};

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("CartProvider / useCart", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.count).toBe(0);
  });

  it("adds an item with quantity 1 by default", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(hummus));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.count).toBe(1);
  });

  it("merges a repeated add into the existing line instead of duplicating", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(hummus));
    act(() => result.current.addItem(hummus));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it("clamps quantity at 50 when adding repeatedly", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(hummus, 40));
    act(() => result.current.addItem(hummus, 40));
    expect(result.current.items[0].quantity).toBe(50);
  });

  it("clamps quantity at 50 via updateQuantity", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(hummus));
    act(() => result.current.updateQuantity(hummus.menuItemId, 999));
    expect(result.current.items[0].quantity).toBe(50);
  });

  it("removes the line entirely when updateQuantity drops to 0 or below", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(hummus));
    act(() => result.current.updateQuantity(hummus.menuItemId, 0));
    expect(result.current.items).toHaveLength(0);
  });

  it("removeItem removes only the targeted line", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(hummus));
    act(() => result.current.addItem(kebab));
    act(() => result.current.removeItem(hummus.menuItemId));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].menuItemId).toBe(kebab.menuItemId);
  });

  it("computes total and count across multiple lines", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(hummus, 2)); // 7.00
    act(() => result.current.addItem(kebab, 1)); // 9.50
    expect(result.current.total).toBeCloseTo(16.5, 2);
    expect(result.current.count).toBe(3);
  });

  it("updateNotes sets and truncates notes to 300 chars", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(hummus));
    act(() => result.current.updateNotes(hummus.menuItemId, "no onions"));
    expect(result.current.items[0].notes).toBe("no onions");

    const long = "x".repeat(400);
    act(() => result.current.updateNotes(hummus.menuItemId, long));
    expect(result.current.items[0].notes).toHaveLength(300);
  });

  it("clearCart empties the cart and leaves sessionStorage representing an empty cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(hummus));
    act(() => result.current.clearCart());
    expect(result.current.items).toEqual([]);
    // clearCart() removes the key directly, but the persist effect (which
    // fires on every `items` change, including this one) writes it straight
    // back as "[]" — behaviorally equivalent on next hydration, so we assert
    // on the parsed value rather than the raw storage state.
    const stored = window.sessionStorage.getItem("cart_items");
    expect(stored === null ? [] : JSON.parse(stored)).toEqual([]);
  });

  it("persists items to sessionStorage and rehydrates a fresh mount", async () => {
    const first = renderHook(() => useCart(), { wrapper });
    act(() => first.result.current.addItem(hummus, 3));

    const second = renderHook(() => useCart(), { wrapper });
    // hydration happens in an effect after mount
    await act(async () => {});
    expect(second.result.current.items).toHaveLength(1);
    expect(second.result.current.items[0].quantity).toBe(3);
  });
});
