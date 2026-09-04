import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { WebsiteHorizonComponent } from './pages/website-horizon.component';

function horizonCanvasFor(url: string): boolean {
  const path = url.split('?')[0];
  if (path === '/' || path === '') return false;
  if (path.startsWith('/splash')) return false;
  return true;
}

/** Root — one horizon canvas behind Lekki + LEO pages. Shells own chrome. */
@Component({
  selector: 'lekki-root',
  standalone: true,
  imports: [RouterOutlet, WebsiteHorizonComponent],
  template: `
    @if (showCanvas()) {
      <leos-website-horizon variant="canvas" />
    }
    <div class="lekki-root__page">
      <router-outlet />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: #00070d;
      }
      .lekki-root__page {
        position: relative;
        z-index: 1;
        min-height: 100dvh;
      }
    `,
  ],
})
export class AppComponent {
  private readonly router = inject(Router);
  readonly showCanvas = signal(horizonCanvasFor(this.router.url));
  private canvasFrame = 0;

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const next = horizonCanvasFor(e.urlAfterRedirects);
        if (this.canvasFrame) {
          cancelAnimationFrame(this.canvasFrame);
          this.canvasFrame = 0;
        }
        if (!next) {
          this.showCanvas.set(false);
          return;
        }
        if (this.showCanvas()) return;
        // Let /signin paint first — mounting four SVGs in the same turn freezes Login.
        this.canvasFrame = requestAnimationFrame(() => {
          this.canvasFrame = 0;
          this.showCanvas.set(true);
        });
      });
  }
}
