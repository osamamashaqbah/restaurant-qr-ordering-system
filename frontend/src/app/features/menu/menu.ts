import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CartService } from '../../core/cart';
import { PublicMenuResponse, PublicMenuService } from '../../core/public-menu';

@Component({
  imports: [DecimalPipe, RouterLink],
  selector: 'app-menu',
  styleUrl: './menu.scss',
  templateUrl: './menu.html',
})
export class Menu {
  private readonly service = inject(PublicMenuService);
  private readonly destroyRef = inject(DestroyRef);
  readonly cart = inject(CartService);

  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly menu = signal<PublicMenuResponse | null>(null);
  readonly itemsByCategory = computed(() => {
    const current = this.menu();
    if (!current) return new Map<string, PublicMenuResponse['items']>();

    return current.categories.reduce((groups, category) => {
      groups.set(category.id, current.items.filter((item) => item.categoryId === category.id));
      return groups;
    }, new Map<string, PublicMenuResponse['items']>());
  });

  constructor() {
    this.service
      .get()
      .pipe(
        catchError(() => {
          this.state.set('error');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((menu) => {
        if (!menu) return;
        this.menu.set(menu);
        this.state.set('ready');
      });
  }
}
