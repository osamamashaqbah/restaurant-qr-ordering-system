import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface KitchenOrder {
  id: string;
  tableNumber: string;
  status: 'new' | 'preparing' | 'ready';
  createdAt: string;
  items: KitchenOrderItem[];
}

export interface KitchenOrderItem {
  id: string;
  nameEn: string;
  quantity: number;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class KitchenService {
  private readonly http = inject(HttpClient);

  getOrders() {
    return this.http.get<KitchenOrder[]>('/api/staff/kitchen/orders');
  }

  startPreparing(orderId: string) {
    return this.http.post<void>(`/api/staff/kitchen/orders/${orderId}/start-preparing`, {});
  }

  markReady(orderId: string) {
    return this.http.post<void>(`/api/staff/kitchen/orders/${orderId}/mark-ready`, {});
  }

  cancel(orderId: string) {
    return this.http.post<void>(`/api/staff/kitchen/orders/${orderId}/cancel`, {});
  }
}
