import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface CreateOrderRequest {
  customerName: string;
  customerWhatsapp: string;
  tableNumber: string;
  items: { menuItemId: string; quantity: number; notes: string }[];
}

export interface CreateOrderResponse {
  trackingToken: string;
}

@Injectable({ providedIn: 'root' })
export class PublicOrdersService {
  private readonly http = inject(HttpClient);

  create(request: CreateOrderRequest, idempotencyKey: string) {
    return this.http.post<CreateOrderResponse>('/api/public/orders', request, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }
}
