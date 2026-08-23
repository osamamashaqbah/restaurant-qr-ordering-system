import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface PublicOrderTracking {
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  items: PublicOrderItem[];
}

export interface PublicOrderItem {
  nameEn: string;
  nameAr: string;
  unitPrice: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class OrderTrackingService {
  private readonly http = inject(HttpClient);

  get(token: string) {
    return this.http.get<PublicOrderTracking>(
      `/api/public/orders/${encodeURIComponent(token)}/tracking`,
    );
  }
}
