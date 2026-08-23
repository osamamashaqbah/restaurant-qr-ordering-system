import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export type StaffRole = 'admin' | 'cashier' | 'kitchen';

export interface AdminStaffMember {
  id: string;
  email: string;
  fullName: string;
  role: StaffRole | null;
  createdAt: string;
}

export interface SalesSummary {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  daily: { day: string; revenue: number }[];
  topItems: { nameEn: string; quantity: number; revenue: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getStaff() {
    return this.http.get<AdminStaffMember[]>('/api/staff/admin/staff');
  }

  updateRole(staffId: string, role: StaffRole) {
    return this.http.patch<void>(`/api/staff/admin/staff/${staffId}/role`, { role });
  }

  getSalesSummary(start: string, end: string) {
    return this.http.get<SalesSummary>(`/api/staff/admin/reports?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  }
}
