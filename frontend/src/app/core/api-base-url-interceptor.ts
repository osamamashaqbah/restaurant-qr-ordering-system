import { HttpInterceptorFn } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL).trim().replace(/\/+$/, '');
  return next(
    baseUrl && request.url.startsWith('/api/')
      ? request.clone({ url: `${baseUrl}${request.url}` })
      : request,
  );
};
