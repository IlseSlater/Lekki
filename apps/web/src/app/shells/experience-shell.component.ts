import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SessionStateService } from '../services/leos-api.service';
import { StudioContextService } from '../services/studio-context.service';

/** LEOS Experience Shell — guests only. Never show Studio / Operate / stations. */
@Component({
  standalone: true,
  selector: 'leos-experience-shell',
  imports: [RouterOutlet],
  template: `
    <div class="leos-experience-shell">
      <header class="leos-experience-shell__header">
        <p class="leos-experience-shell__brand">
          <img src="/brand/lekki-mark.svg" alt="" width="22" height="22" />
          <span>{{ brandLabel }}</span>
        </p>
        @if (placeHint) {
          <p class="leos-experience-shell__place">{{ placeHint }}</p>
        }
      </header>
      <main class="leos-experience-shell__main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .leos-experience-shell {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        background: transparent;
      }
      .leos-experience-shell__header {
        padding: 0.75rem 1.25rem;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        background: color-mix(in srgb, var(--leos-warm-sand, #ffffff) 88%, transparent);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .leos-experience-shell__brand {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.875rem;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: var(--leos-ink, #1b2230);
      }
      .leos-experience-shell__brand img {
        display: block;
        width: 1.35rem;
        height: 1.35rem;
      }
      .leos-experience-shell__place {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 600;
        color: #5c6573;
      }
      .leos-experience-shell__main {
        flex: 1;
        padding: 1rem 1.25rem 1.5rem;
        max-width: 32rem;
        margin: 1rem auto 1.5rem;
        width: 100%;
        background: color-mix(in srgb, var(--leos-warm-sand, #ffffff) 90%, transparent);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 1.5rem;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
      }
    `,
  ],
})
export class ExperienceShellComponent implements OnInit {
  private readonly state = inject(SessionStateService);
  private readonly ctx = inject(StudioContextService);
  private readonly router = inject(Router);

  brandLabel = 'Lekki';
  placeHint = '';

  ngOnInit() {
    this.state.restore();
    this.refresh();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.refresh());
  }

  private refresh() {
    this.state.restore();
    const venue = this.state.venueName || this.ctx.displayVenue();
    const joined = !!this.state.sessionId;
    this.brandLabel = joined && venue && venue !== 'Your experience' ? venue : 'Lekki';
    this.placeHint =
      joined && this.state.physicalContextCode
        ? this.state.physicalContextCode
        : '';
  }
}
