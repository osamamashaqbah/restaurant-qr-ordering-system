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

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getStaff() {
    return this.http.get<AdminStaffMember[]>('/api/staff/admin/staff');
  }

  updateRole(staffId: string, role: StaffRole) {
    return this.http.patch<void>(`/api/staff/admin/staff/${staffId}/role`, { role });
  }
}
