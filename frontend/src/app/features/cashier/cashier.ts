import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { CashierOrder, CashierService } from '../../core/cashier';
import { StaffAuthService } from '../../core/supabase-auth';

@Component({
  imports: [DecimalPipe],
  selector: 'app-cashier',
  styleUrl: './cashier.scss',
  templateUrl: './cashier.html',
})
export class Cashier {
  private readonly service = inject(CashierService);
  readonly auth = inject(StaffAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly orders = signal<CashierOrder[]>([]);
  readonly busyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly readyOrders = computed(() => this.orders().filter((order) => order.status === 'ready'));
  readonly newCount = computed(() => this.orders().filter((order) => order.status === 'new').length);
  readonly preparingCount = computed(() => this.orders().filter((order) => order.status === 'preparing').length);

  constructor() {
    timer(0, 10_000)
      .pipe(
        switchMap(() => this.service.getOrders().pipe(
          catchError(() => {
            this.state.set('error');
            return EMPTY;
          }),
        )),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((orders) => {
        this.orders.set(orders);
        this.state.set('ready');
      });
  }

  close(orderId: string): void {
    if (this.busyId()) return;

    this.busyId.set(orderId);
    this.error.set(null);
    this.service.close(orderId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busyId.set(null);
        this.refresh();
      },
      error: (error: HttpErrorResponse) => {
        this.busyId.set(null);
        this.error.set(error.status === 409 ? 'That order is no longer ready.' : 'Could not close the order.');
      },
    });
  }

  private refresh(): void {
    this.service.getOrders().subscribe({
      next: (orders) => this.orders.set(orders),
      error: () => this.error.set('Could not refresh cashier orders.'),
    });
  }
}
