import { Injectable, signal } from '@angular/core';

/** Bumps when Studio menu saves so Live Experience phone reloads catalogue. */
@Injectable({ providedIn: 'root' })
export class CatalogueLiveService {
  readonly revision = signal(0);

  bump() {
    this.revision.update((n) => n + 1);
  }
}
