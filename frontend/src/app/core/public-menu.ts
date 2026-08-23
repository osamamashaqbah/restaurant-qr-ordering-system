import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface PublicMenuResponse {
  categories: PublicCategory[];
  items: PublicMenuItem[];
}

export interface PublicCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
}

export interface PublicMenuItem {
  id: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  imageUrl: string | null;
  allergens: string[];
  isAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class PublicMenuService {
  private readonly http = inject(HttpClient);

  get() {
    return this.http.get<PublicMenuResponse>('/api/public/menu');
  }
}
