import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig, runtime } from './app/app.config';
import { App } from './app/app';

Sentry.init({
  dsn: runtime.sentryDsn,
  enabled: Boolean(runtime.sentryDsn),
  environment: runtime.environment ?? 'production',
  integrations: [Sentry.browserTracingIntegration()],
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  tracePropagationTargets: ['localhost', /^\/api\//, 'https://restaurant-qr-ordering-api.onrender.com'],
});

bootstrapApplication(App, appConfig)
  .catch((err) => Sentry.captureException(err));
