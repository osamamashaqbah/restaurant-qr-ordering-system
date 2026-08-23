import { Injectable, signal } from '@angular/core';

export interface CustomerSessionData {
  name: string;
  whatsapp: string;
  tableNumber: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerSessionService {
  private readonly storageKey = 'customer_session';
  private readonly storage = typeof sessionStorage === 'undefined' ? null : sessionStorage;
  private readonly current = signal<CustomerSessionData | null>(this.load());

  readonly session = this.current.asReadonly();

  set(value: CustomerSessionData) {
    this.current.set(value);
    this.storage?.setItem(this.storageKey, JSON.stringify(value));
  }

  clear() {
    this.current.set(null);
    this.storage?.removeItem(this.storageKey);
  }

  private load(): CustomerSessionData | null {
    const raw = this.storage?.getItem(this.storageKey);
    if (!raw) return null;

    try {
      const value = JSON.parse(raw) as CustomerSessionData;
      return value && typeof value.name === 'string' && typeof value.whatsapp === 'string' && typeof value.tableNumber === 'string'
        ? value
        : null;
    } catch {
      return null;
    }
  }
}
