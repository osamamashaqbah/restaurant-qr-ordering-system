import { Routes } from '@angular/router';
import { OrderTracking } from './features/order-tracking/order-tracking';
import { Menu } from './features/menu/menu';
import { Entry } from './features/entry/entry';
import { Cart } from './features/cart/cart';

export const routes: Routes = [
  { path: '', component: Entry },
  { path: 'menu', component: Menu },
  { path: 'cart', component: Cart },
  { path: 'order/:trackingToken', component: OrderTracking },
  { path: '**', redirectTo: 'menu' },
];
