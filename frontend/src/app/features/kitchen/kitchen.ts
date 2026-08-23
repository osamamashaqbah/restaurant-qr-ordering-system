import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { KitchenOrder, KitchenService } from '../../core/kitchen';
import { StaffAuthService } from '../../core/supabase-auth';

type BoardState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-kitchen',
  styleUrl: './kitchen.scss',
  templateUrl: './kitchen.html',
})
export class Kitchen {
  private readonly service = inject(KitchenService);
  readonly auth = inject(StaffAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<BoardState>('loading');
  readonly orders = signal<KitchenOrder[]>([]);
  readonly busyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly currentUser = this.auth.identity;
  readonly boardColumns = [
    { key: 'new', title: 'New' },
    { key: 'preparing', title: 'Preparing' },
    { key: 'ready', title: 'Ready' },
  ] as const;
  readonly columns = computed(() => ({
    new: this.orders().filter((order) => order.status === 'new'),
    preparing: this.orders().filter((order) => order.status === 'preparing'),
    ready: this.orders().filter((order) => order.status === 'ready'),
  }));

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

  ageMinutes(createdAt: string): number {
    return Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60_000));
  }

  async transition(orderId: string, action: 'startPreparing' | 'markReady' | 'cancel'): Promise<void> {
    if (this.busyId()) return;

    this.busyId.set(orderId);
    this.error.set(null);
    const request = this.service[action](orderId);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busyId.set(null);
        this.service.getOrders().subscribe({
          next: (orders) => this.orders.set(orders),
          error: () => this.error.set('Could not refresh the kitchen board.'),
        });
      },
      error: (error: HttpErrorResponse) => {
        this.busyId.set(null);
        this.error.set(error.status === 409 ? 'That order changed. Refresh and try again.' : 'Could not update the order.');
      },
    });
  }
}
