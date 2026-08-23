import { computed, Injectable, signal } from '@angular/core';
import { PublicMenuItem } from './public-menu';

export interface CartItem {
  menuItemId: string;
  nameEn: string;
  nameAr: string;
  price: number;
  quantity: number;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'cart_items';
  private readonly orderAttemptKeyStorageKey = 'cart_order_attempt_key';
  private readonly storage = typeof sessionStorage === 'undefined' ? null : sessionStorage;
  private readonly current = signal<CartItem[]>(this.load());

  readonly items = this.current.asReadonly();
  readonly count = computed(() => this.current().reduce((total, item) => total + item.quantity, 0));
  readonly total = computed(() => this.current().reduce((total, item) => total + item.price * item.quantity, 0));

  add(item: PublicMenuItem) {
    this.current.update((items) => {
      const existing = items.find((entry) => entry.menuItemId === item.id);
      if (existing) {
        return items.map((entry) =>
          entry.menuItemId === item.id ? { ...entry, quantity: Math.min(50, entry.quantity + 1) } : entry,
        );
      }

      return [
        ...items,
        { menuItemId: item.id, nameEn: item.nameEn, nameAr: item.nameAr, price: item.price, quantity: 1, notes: '' },
      ];
    });
    this.clearOrderAttemptKey();
    this.persist();
  }

  updateQuantity(menuItemId: string, quantity: number) {
    this.current.update((items) =>
      items
        .map((item) => (item.menuItemId === menuItemId ? { ...item, quantity: Math.min(50, quantity) } : item))
        .filter((item) => item.quantity > 0),
    );
    this.clearOrderAttemptKey();
    this.persist();
  }

  updateNotes(menuItemId: string, notes: string) {
    this.current.update((items) =>
      items.map((item) => (item.menuItemId === menuItemId ? { ...item, notes: notes.slice(0, 300) } : item)),
    );
    this.clearOrderAttemptKey();
    this.persist();
  }

  clear() {
    this.current.set([]);
    this.clearOrderAttemptKey();
    this.storage?.removeItem(this.storageKey);
  }

  getOrderAttemptKey(): string {
    const existing = this.storage?.getItem(this.orderAttemptKeyStorageKey);
    if (existing && /^[A-Za-z0-9_-]{43}$/.test(existing)) return existing;

    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    const raw = btoa(String.fromCharCode(...bytes));
    const key = raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    this.storage?.setItem(this.orderAttemptKeyStorageKey, key);
    return key;
  }

  private persist() {
    this.storage?.setItem(this.storageKey, JSON.stringify(this.current()));
  }

  private clearOrderAttemptKey() {
    this.storage?.removeItem(this.orderAttemptKeyStorageKey);
  }

  private load(): CartItem[] {
    const raw = this.storage?.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const value = JSON.parse(raw) as CartItem[];
      return Array.isArray(value) ? value.filter((item) => item && typeof item.menuItemId === 'string' && item.quantity > 0) : [];
    } catch {
      return [];
    }
  }
}
