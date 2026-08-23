import { Routes } from '@angular/router';
import { OrderTracking } from './features/order-tracking/order-tracking';

export const routes: Routes = [
  { path: 'order/:trackingToken', component: OrderTracking },
  { path: '**', redirectTo: '' },
];
