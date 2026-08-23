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

export interface AdminSecurityEvent {
  id: string;
  eventType: string;
  actorEmail: string | null;
  targetEmail: string | null;
  oldRole: string | null;
  newRole: string | null;
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

  getSecurityEvents() {
    return this.http.get<AdminSecurityEvent[]>('/api/staff/admin/security-events');
  }

  updateRole(staffId: string, role: StaffRole) {
    return this.http.patch<void>(`/api/staff/admin/staff/${staffId}/role`, { role });
  }

  getSalesSummary(start: string, end: string) {
    return this.http.get<SalesSummary>(`/api/staff/admin/reports?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  }
}
