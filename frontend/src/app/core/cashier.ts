import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PublicMenuResponse } from './public-menu';

export interface CashierOrder {
  id: string;
  tableNumber: string;
  status: 'new' | 'preparing' | 'ready';
  customerName: string;
  customerWhatsapp: string;
  total: number;
  createdAt: string;
  items: CashierOrderItem[];
}

export interface CashierOrderItem {
  id: string;
  nameEn: string;
  quantity: number;
  unitPrice: number;
}

@Injectable({ providedIn: 'root' })
export class CashierService {
  private readonly http = inject(HttpClient);

  getOrders() {
    return this.http.get<CashierOrder[]>('/api/staff/cashier/orders');
  }

  close(orderId: string) {
    return this.http.post<void>(`/api/staff/cashier/orders/${orderId}/close`, {});
  }

  getMenu() {
    return this.http.get<PublicMenuResponse>('/api/staff/cashier/menu');
  }

  setAvailability(itemId: string, isAvailable: boolean) {
    return this.http.post<void>(`/api/staff/cashier/menu/items/${itemId}/availability`, { isAvailable });
  }
}
