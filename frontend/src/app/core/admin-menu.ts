import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PublicMenuResponse } from './public-menu';

export interface CategoryInput {
  nameEn: string;
  nameAr: string;
  sortOrder: number;
}

export interface MenuItemInput {
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
export class AdminMenuService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/staff/admin/menu';

  get() {
    return this.http.get<PublicMenuResponse>(this.baseUrl);
  }

  createCategory(input: CategoryInput) {
    return this.http.post<{ id: string }>(`${this.baseUrl}/categories`, input);
  }

  updateCategory(id: string, input: CategoryInput) {
    return this.http.put<void>(`${this.baseUrl}/categories/${id}`, input);
  }

  deleteCategory(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  createItem(input: MenuItemInput) {
    return this.http.post<{ id: string }>(`${this.baseUrl}/items`, input);
  }

  updateItem(id: string, input: MenuItemInput) {
    return this.http.put<void>(`${this.baseUrl}/items/${id}`, input);
  }

  deleteItem(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/items/${id}`);
  }
}
