import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { routes } from './app.routes';
import { API_BASE_URL, apiBaseUrlInterceptor } from './core/api-base-url-interceptor';
import { provideSupabaseAuth, SupabaseRuntimeConfig } from './core/supabase-auth';
import { staffAuthInterceptor } from './core/staff-auth-interceptor';

export type RestaurantRuntimeConfig = Partial<SupabaseRuntimeConfig> & {
  apiBaseUrl?: string;
  sentryDsn?: string;
  environment?: string;
};

type RuntimeWindow = Window & { __RESTAURANT_CONFIG__?: RestaurantRuntimeConfig };
export const runtime = (globalThis as unknown as RuntimeWindow).__RESTAURANT_CONFIG__ ?? {};
const apiBaseUrl = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname)
  ? ''
  : runtime.apiBaseUrl ?? '';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiBaseUrlInterceptor, staffAuthInterceptor])),
    { provide: API_BASE_URL, useValue: apiBaseUrl },
    provideSupabaseAuth({ url: runtime.url ?? '', anonKey: runtime.anonKey ?? '' }),
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler() },
    { provide: Sentry.TraceService, deps: [Router] },
    provideAppInitializer(() => {
      inject(Sentry.TraceService);
    }),
  ]
};
