import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withPreloading } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { SigninPreloadStrategy } from './app/signin-preload.strategy';
import { staffAuthInterceptor } from './app/services/staff-auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(SigninPreloadStrategy)),
    provideHttpClient(withInterceptors([staffAuthInterceptor])),
  ],
}).catch((err) => console.error(err));
