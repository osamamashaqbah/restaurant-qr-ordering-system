import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PublicRatingService {
  private readonly http = inject(HttpClient);

  submit(trackingToken: string, stars: number, comment: string) {
    return this.http.post<void>(`/api/public/orders/${trackingToken}/rating`, { stars, comment });
  }
}
