import { Routes } from '@angular/router';
import { OrderTracking } from './features/order-tracking/order-tracking';
import { Menu } from './features/menu/menu';
import { Entry } from './features/entry/entry';
import { Cart } from './features/cart/cart';
import { Login } from './features/login/login';
import { Kitchen } from './features/kitchen/kitchen';
import { Cashier } from './features/cashier/cashier';
import { Admin } from './features/admin/admin';
import { AdminMenu } from './features/admin-menu/admin-menu';
import { Rating } from './features/rating/rating';
import { staffRoleGuard } from './core/staff-role.guard';

export const routes: Routes = [
  { path: '', component: Entry },
  { path: 'menu', component: Menu },
  { path: 'cart', component: Cart },
  { path: 'order/:trackingToken', component: OrderTracking },
  { path: 'rate/:trackingToken', component: Rating },
  { path: 'login', component: Login },
  { path: 'kitchen', component: Kitchen, canActivate: [staffRoleGuard('kitchen')] },
  { path: 'cashier', component: Cashier, canActivate: [staffRoleGuard('cashier')] },
  { path: 'admin', component: Admin, canActivate: [staffRoleGuard('admin')] },
  { path: 'admin/menu', component: AdminMenu, canActivate: [staffRoleGuard('admin')] },
  { path: '**', redirectTo: 'menu' },
];
