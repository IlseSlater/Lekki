import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SessionStateService } from '../services/leos-api.service';
import { StudioContextService } from '../services/studio-context.service';
import { guestPlaceSpoken } from '../studio/place-continuity';

/** LEOS Experience Shell — guests only. Never show Studio / Operate / stations. */
@Component({
  standalone: true,
  selector: 'leos-experience-shell',
  imports: [RouterOutlet],
  template: `
    <div class="leos-experience-shell">
      <header
        class="leos-experience-shell__header sticky top-0 z-20"
        [attr.aria-label]="identityAria"
      >
        <div class="leos-experience-shell__identity">
          <p class="leos-experience-shell__brand">
            @if (logoUrl) {
              <img [src]="logoUrl" width="22" height="22" alt="" />
            } @else if (!joined) {
              <img src="/brand/lekki-mark.svg" alt="" width="22" height="22" />
            }
            <span>{{ brandLabel }}</span>
          </p>
          @if (joined && placeSpoken) {
            <p class="leos-experience-shell__place">{{ placeSpoken }}</p>
          }
        </div>
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
        padding: 0.85rem 1.35rem;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: color-mix(in srgb, var(--leos-ground, #00070d) 72%, transparent);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .leos-experience-shell__identity {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }
      .leos-experience-shell__brand {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-family: var(--leos-font-display, Fraunces, Georgia, serif);
        font-size: 1.05rem;
        font-weight: 650;
        letter-spacing: -0.03em;
        color: #fff3f0;
      }
      .leos-experience-shell__brand img {
        display: block;
        width: 1.5rem;
        height: 1.5rem;
        object-fit: contain;
        border-radius: 0.35rem;
      }
      .leos-experience-shell__place {
        margin: 0;
        font-family: var(--leos-font-ui, Sora, system-ui, sans-serif);
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        line-height: 1.3;
        color: color-mix(in srgb, #fff3f0 78%, transparent);
      }
      /* One sheet — not a card sitting on another card. */
      .leos-experience-shell__main {
        flex: 1;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 1.25rem 1.35rem 1.75rem;
        background: var(--leos-warm-sand, #ffffff);
        border-radius: 1.5rem 1.5rem 0 0;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }
    `,
  ],
})
export class ExperienceShellComponent implements OnInit {
  private readonly state = inject(SessionStateService);
  private readonly ctx = inject(StudioContextService);
  private readonly router = inject(Router);

  brandLabel = 'Lekki';
  logoUrl = '';
  placeSpoken = '';
  joined = false;

  get identityAria(): string {
    if (this.joined && this.placeSpoken) {
      return `${this.brandLabel} · ${this.placeSpoken}`;
    }
    return this.brandLabel;
  }

  ngOnInit() {
    this.state.restore();
    this.refresh();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.refresh());
  }

  private refresh() {
    this.state.restore();
    const venue = this.state.venueName || this.ctx.displayVenue();
    this.joined = !!this.state.sessionId;
    // After join: venue owns the shell — never Lekki mark/name.
    this.brandLabel =
      this.joined && venue && venue !== 'Your experience' ? venue : this.joined ? 'Your place' : 'Lekki';
    this.logoUrl = this.joined ? (this.state.logoUrl || '').trim() : '';
    const placeNoun =
      (this.state.terminology?.['physicalContext'] || '').trim() || 'Table';
    this.placeSpoken = this.joined
      ? guestPlaceSpoken(placeNoun, this.state.physicalContextCode)
      : '';
  }
}
