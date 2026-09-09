import { Routes } from '@angular/router';
import { staffRoleGuard } from './core/staff-role.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/entry/entry').then(({ Entry }) => Entry) },
  { path: 'menu', loadComponent: () => import('./features/menu/menu').then(({ Menu }) => Menu) },
  { path: 'cart', loadComponent: () => import('./features/cart/cart').then(({ Cart }) => Cart) },
  { path: 'order', loadComponent: () => import('./features/order-tracking/order-tracking').then(({ OrderTracking }) => OrderTracking) },
  { path: 'order/:trackingToken', loadComponent: () => import('./features/order-tracking/order-tracking').then(({ OrderTracking }) => OrderTracking) }, // legacy capability URL: stripped into sessionStorage
  { path: 'rate', loadComponent: () => import('./features/rating/rating').then(({ Rating }) => Rating) },
  { path: 'rate/:trackingToken', loadComponent: () => import('./features/rating/rating').then(({ Rating }) => Rating) }, // legacy capability URL: stripped into sessionStorage
  { path: 'guide', loadComponent: () => import('./features/guide/guide').then(({ Guide }) => Guide) },
  { path: 'login', loadComponent: () => import('./features/login/login').then(({ Login }) => Login) },
  { path: 'kitchen', loadComponent: () => import('./features/kitchen/kitchen').then(({ Kitchen }) => Kitchen), canActivate: [staffRoleGuard('kitchen')] },
  { path: 'cashier', loadComponent: () => import('./features/cashier/cashier').then(({ Cashier }) => Cashier), canActivate: [staffRoleGuard('cashier')] },
  { path: 'admin', loadComponent: () => import('./features/admin/admin').then(({ Admin }) => Admin), canActivate: [staffRoleGuard('admin')] },
  { path: 'admin/menu', loadComponent: () => import('./features/admin-menu/admin-menu').then(({ AdminMenu }) => AdminMenu), canActivate: [staffRoleGuard('admin')] },
  { path: '**', redirectTo: 'menu' },
];
