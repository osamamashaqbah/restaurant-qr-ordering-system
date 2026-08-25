import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/cart';
import { CustomerSessionService } from '../../core/customer-session';
import { PublicOrdersService } from '../../core/public-orders';
import { TrackingTokenSessionService } from '../../core/tracking-token-session';

@Component({
  imports: [DecimalPipe, RouterLink],
  selector: 'app-cart',
  styleUrl: './cart.scss',
  templateUrl: './cart.html',
})
export class Cart {
  readonly cart = inject(CartService);
  private readonly session = inject(CustomerSessionService);
  private readonly orders = inject(PublicOrdersService);
  private readonly trackingToken = inject(TrackingTokenSessionService);
  private readonly router = inject(Router);

  readonly customer = this.session.session;
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  updateNotes(menuItemId: string, event: Event) {
    this.cart.updateNotes(menuItemId, (event.target as HTMLInputElement).value);
  }

  submit() {
    const customer = this.customer();
    if (!customer || this.cart.items().length === 0) return;

    this.error.set(null);
    this.submitting.set(true);
    this.orders
      .create({
        customerName: customer.name,
        customerWhatsapp: customer.whatsapp,
        tableNumber: customer.tableNumber,
        items: this.cart.items().map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      }, this.cart.getOrderAttemptKey())
      .subscribe({
        next: (response) => {
          this.cart.clear();
          this.trackingToken.set(response.trackingToken);
          void this.router.navigate(['/order']);
        },
        error: () => {
          this.error.set('We could not send the order. Please try again.');
          this.submitting.set(false);
        },
      });
  }
}
