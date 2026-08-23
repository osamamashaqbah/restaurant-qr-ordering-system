import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { CashierOrder, CashierService } from '../../core/cashier';
import { PublicMenuItem, PublicMenuResponse } from '../../core/public-menu';
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
  readonly tab = signal<'orders' | 'availability'>('orders');
  readonly orders = signal<CashierOrder[]>([]);
  readonly menuState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly menu = signal<PublicMenuResponse | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly readyOrders = computed(() => this.orders().filter((order) => order.status === 'ready'));
  readonly newCount = computed(() => this.orders().filter((order) => order.status === 'new').length);
  readonly preparingCount = computed(() => this.orders().filter((order) => order.status === 'preparing').length);
  readonly itemsByCategory = computed(() => {
    const menu = this.menu();
    if (!menu) return new Map<string, PublicMenuItem[]>();
    return menu.categories.reduce((groups, category) => {
      groups.set(category.id, menu.items.filter((item) => item.categoryId === category.id));
      return groups;
    }, new Map<string, PublicMenuItem[]>());
  });

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

  showAvailability(): void {
    this.tab.set('availability');
    if (this.menuState() === 'idle') this.loadMenu();
  }

  showOrders(): void {
    this.tab.set('orders');
  }

  toggleAvailability(item: PublicMenuItem): void {
    if (this.busyId()) return;

    this.busyId.set(item.id);
    this.error.set(null);
    this.service.setAvailability(item.id, !item.isAvailable)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.menu.update((menu) => menu
            ? { ...menu, items: menu.items.map((current) => current.id === item.id ? { ...current, isAvailable: !item.isAvailable } : current) }
            : menu);
        },
        error: () => {
          this.busyId.set(null);
          this.error.set('Could not update availability.');
        },
      });
  }

  private refresh(): void {
    this.service.getOrders().subscribe({
      next: (orders) => this.orders.set(orders),
      error: () => this.error.set('Could not refresh cashier orders.'),
    });
  }

  private loadMenu(): void {
    this.menuState.set('loading');
    this.service.getMenu().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (menu) => {
        this.menu.set(menu);
        this.menuState.set('ready');
      },
      error: () => {
        this.menuState.set('error');
        this.error.set('Could not load menu availability.');
      },
    });
  }
}
