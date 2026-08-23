import { Routes } from '@angular/router';
import { OrderTracking } from './features/order-tracking/order-tracking';
import { Menu } from './features/menu/menu';

export const routes: Routes = [
  { path: 'menu', component: Menu },
  { path: 'order/:trackingToken', component: OrderTracking },
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
  { path: '**', redirectTo: 'menu' },
];
