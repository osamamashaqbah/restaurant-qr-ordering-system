import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError } from 'rxjs';
import { AdminService, AdminStaffMember, StaffRole } from '../../core/admin';
import { StaffAuthService } from '../../core/supabase-auth';

@Component({
  selector: 'app-admin',
  styleUrl: './admin.scss',
  templateUrl: './admin.html',
})
export class Admin {
  private readonly service = inject(AdminService);
  readonly auth = inject(StaffAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly staff = signal<AdminStaffMember[]>([]);
  readonly busyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly roles: StaffRole[] = ['admin', 'cashier', 'kitchen'];

  constructor() {
    this.service.getStaff().pipe(
      catchError(() => {
        this.state.set('error');
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((staff) => {
      this.staff.set(staff);
      this.state.set('ready');
    });
  }

  updateRole(member: AdminStaffMember, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as StaffRole;
    if (!this.roles.includes(role) || member.role === role || this.busyId()) return;

    this.busyId.set(member.id);
    this.error.set(null);
    this.service.updateRole(member.id, role).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busyId.set(null);
        this.staff.update((staff) => staff.map((current) => current.id === member.id ? { ...current, role } : current));
      },
      error: (error: HttpErrorResponse) => {
        this.busyId.set(null);
        this.error.set(error.status === 409 ? 'You cannot change your own role.' : 'Could not update this role.');
      },
    });
  }
}
