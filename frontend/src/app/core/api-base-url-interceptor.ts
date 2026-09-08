import { HttpInterceptorFn } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { timeout } from 'rxjs';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
const API_REQUEST_TIMEOUT_MS = 15_000;

export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL).trim().replace(/\/+$/, '');
  return next(
    baseUrl && request.url.startsWith('/api/')
      ? request.clone({ url: `${baseUrl}${request.url}` })
      : request,
  ).pipe(timeout({ each: API_REQUEST_TIMEOUT_MS }));
};
