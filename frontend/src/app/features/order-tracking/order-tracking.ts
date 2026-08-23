import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { OrderTrackingService, PublicOrderTracking } from '../../core/order-tracking';

type ViewState = 'loading' | 'ready' | 'not-found' | 'error';
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

@Component({
  imports: [DecimalPipe, RouterLink],
  selector: 'app-order-tracking',
  styleUrl: './order-tracking.scss',
  templateUrl: './order-tracking.html',
})
export class OrderTracking {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrderTrackingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly token = this.route.snapshot.paramMap.get('trackingToken') ?? '';

  readonly state = signal<ViewState>('loading');
  readonly order = signal<PublicOrderTracking | null>(null);

  constructor() {
    if (!TOKEN_PATTERN.test(this.token)) {
      this.state.set('not-found');
      return;
    }

    timer(0, 10_000)
      .pipe(
        switchMap(() =>
          this.service.get(this.token).pipe(
            catchError((error: HttpErrorResponse) => {
              this.state.set(error.status === 404 ? 'not-found' : 'error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((order) => {
        this.order.set(order);
        this.state.set('ready');
      });
  }
}
