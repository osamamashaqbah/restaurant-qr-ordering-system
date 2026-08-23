import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideSupabaseAuth, SupabaseRuntimeConfig } from './core/supabase-auth';
import { staffAuthInterceptor } from './core/staff-auth-interceptor';

type RuntimeWindow = Window & { __RESTAURANT_CONFIG__?: Partial<SupabaseRuntimeConfig> };
const runtime = (globalThis as unknown as RuntimeWindow).__RESTAURANT_CONFIG__ ?? {};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([staffAuthInterceptor])),
    provideSupabaseAuth({ url: runtime.url ?? '', anonKey: runtime.anonKey ?? '' }),
  ]
};
