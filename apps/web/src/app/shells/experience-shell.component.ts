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
        background:
          radial-gradient(120% 80% at 50% -10%, rgba(215, 161, 74, 0.14), transparent 55%),
          var(--leos-warm-sand, #faf7f2);
      }
      .leos-experience-shell__header {
        padding: 0.75rem 1.25rem;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
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
        padding: 0 1rem 0;
        max-width: 32rem;
        margin: 0 auto;
        width: 100%;
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
