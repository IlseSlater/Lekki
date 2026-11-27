import { Injectable, signal } from '@angular/core';
import type { PreviewScreen } from '../preview/preview-protocol';

/**
 * A Studio page says which guest screen the owner is working on
 * (focus on tips → the pay screen), and the preview phone turns to it.
 */
@Injectable({ providedIn: 'root' })
export class PreviewFocusService {
  /** Bumps on every request so the same screen can be asked for twice. */
  readonly request = signal<{ screen: PreviewScreen; at: number } | null>(null);

  show(screen: PreviewScreen) {
    this.request.set({ screen, at: Date.now() });
  }
}
