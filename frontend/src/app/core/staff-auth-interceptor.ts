import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, of, switchMap } from 'rxjs';
import { SUPABASE_CLIENT } from './supabase-auth';

export const staffAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const client = inject(SUPABASE_CLIENT);
  if (!client) return next(request);

  return from(client.auth.getSession()).pipe(
    catchError(() => of({ data: { session: null } })),
    switchMap(({ data }) => {
      const accessToken = data.session?.access_token;
      return next(accessToken
        ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
        : request);
    }),
  );
};
