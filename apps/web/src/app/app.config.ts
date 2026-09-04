import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { SigninPreloadStrategy } from './signin-preload.strategy';
import { staffAuthInterceptor } from './services/staff-auth.interceptor';

/**
 * Browser application config.
 * Batch 7: hydration + fetch so prerendered marketing hydrates cleanly.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(SigninPreloadStrategy)),
    provideHttpClient(withFetch(), withInterceptors([staffAuthInterceptor])),
    provideClientHydration(withEventReplay()),
  ],
};
