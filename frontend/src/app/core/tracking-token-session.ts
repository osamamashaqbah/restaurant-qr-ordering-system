import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TrackingTokenSessionService {
  private readonly storageKey = 'order_tracking_token';
  private readonly storage = typeof sessionStorage === 'undefined' ? null : sessionStorage;

  get(): string {
    return this.storage?.getItem(this.storageKey) ?? '';
  }

  set(token: string): void {
    this.storage?.setItem(this.storageKey, token);
  }

  clear(): void {
    this.storage?.removeItem(this.storageKey);
  }
}
