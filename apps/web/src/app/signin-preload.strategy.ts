import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/** Warm Studio sign-in only. Preloading every lazy page freezes Login. */
@Injectable({ providedIn: 'root' })
export class SigninPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.path === 'signin' ? load() : of(null);
  }
}
