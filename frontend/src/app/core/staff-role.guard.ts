import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { StaffAuthService } from './supabase-auth';

export function staffRoleGuard(requiredRole: 'admin' | 'cashier' | 'kitchen'): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(StaffAuthService);
    const router = inject(Router);
    await auth.ready();

    if (!auth.session()) {
      return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
    }

    const identity = auth.identity() ?? await auth.refreshIdentity();
    return identity?.role === requiredRole
      ? true
      : router.createUrlTree(['/login'], { queryParams: { error: 'not_authorized' } });
  };
}
