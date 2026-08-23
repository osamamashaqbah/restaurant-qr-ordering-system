import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import { AdminSecurityEvent, AdminService, AdminStaffMember, SalesSummary, StaffRole } from '../../core/admin';
import { StaffAuthService } from '../../core/supabase-auth';

@Component({
  imports: [DatePipe, DecimalPipe, RouterLink],
  selector: 'app-admin',
  styleUrl: './admin.scss',
  templateUrl: './admin.html',
})
export class Admin {
  private readonly service = inject(AdminService);
  readonly auth = inject(StaffAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly tab = signal<'staff' | 'reports'>('staff');
  readonly staff = signal<AdminStaffMember[]>([]);
  readonly securityEvents = signal<AdminSecurityEvent[]>([]);
  readonly eventsState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly reportState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly report = signal<SalesSummary | null>(null);
  readonly reportStart = signal(this.isoDate(-6));
  readonly reportEnd = signal(this.isoDate(0));
  readonly busyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly roles: StaffRole[] = ['admin', 'cashier', 'kitchen'];
  readonly Math = Math;

  constructor() {
    this.loadSecurityEvents();
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

  private loadSecurityEvents(): void {
    this.service.getSecurityEvents().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (events) => {
        this.securityEvents.set(events);
        this.eventsState.set('ready');
      },
      error: () => this.eventsState.set('error'),
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

  showStaff(): void {
    this.tab.set('staff');
  }

  showReports(): void {
    this.tab.set('reports');
    if (this.reportState() === 'idle') this.loadReport();
  }

  loadReport(): void {
    this.reportState.set('loading');
    this.service.getSalesSummary(
      `${this.reportStart()}T00:00:00Z`,
      `${this.reportEnd()}T23:59:59.999999Z`,
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (report) => {
        this.report.set(report);
        this.reportState.set('ready');
      },
      error: () => this.reportState.set('error'),
    });
  }

  maxDaily(): number {
    return Math.max(1, ...(this.report()?.daily.map((day) => day.revenue) ?? [0]));
  }

  private isoDate(daysFromToday: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString().slice(0, 10);
  }
}
