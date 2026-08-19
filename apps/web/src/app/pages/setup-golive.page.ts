import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { EntryQrComponent } from '../leos/entry-qr.component';
import { entryUrlForToken, resolvePublicWebOrigin } from '../services/public-origin';

/**
 * Studio S4 — Generate QR (Activate). Continues to S5 Live achievement.
 * QR URLs use LAN origin so phones on the same Wi‑Fi can open them.
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ExperienceScreenComponent, EntryQrComponent],
  template: `
    <leos-experience-screen
      purpose="Generate QR"
      lead="Print or show a code — guests scan and join."
      help=""
      [showFooter]="true"
    >
      @if (publicOrigin) {
        <p class="leos-muted" style="margin-bottom:1rem;">
          Guest link host: <code>{{ publicOrigin }}</code>
        </p>
      }
      @for (t of tokens; track t.token) {
        <div class="leos-golive-card" [class.leos-golive-card--selected]="selected === t.token">
          <leos-entry-qr [value]="entryUrl(t.token)" [label]="t.label" />
          <div class="leos-golive-card__meta">
            <strong>{{ t.label }}</strong>
            <div class="leos-golive-card__actions">
              <button type="button" class="leos-btn leos-btn--secondary" (click)="select(t)">
                Use this QR
              </button>
              <button type="button" class="leos-btn leos-btn--secondary" (click)="copy(entryUrl(t.token))">
                Copy link
              </button>
              <a
                class="leos-btn leos-btn--secondary"
                [href]="entryUrl(t.token)"
                target="_blank"
                rel="noopener"
              >
                Open Experience
              </a>
            </div>
          </div>
        </div>
      }
      @if (copied) {
        <p class="leos-success-banner" role="status" style="margin-top:1rem;">
          Copied — share with a guest or open Experience.
        </p>
      }
      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio">Back</a>
      <a
        primary
        class="leos-btn leos-btn--primary"
        routerLink="/studio/live"
        [class.leos-btn--disabled]="!selected"
        (click)="persistBeforeLive($event)"
      >
        Your experience is live →
      </a>
    </leos-experience-screen>
  `,
  styles: [
    `
      .leos-golive-card {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        flex-wrap: wrap;
        padding: 1rem 0;
        border-bottom: 1px solid var(--studio-line, #e5e7eb);
      }
      .leos-golive-card:last-of-type {
        border-bottom: none;
      }
      .leos-golive-card--selected {
        outline: 2px solid var(--studio-accent, #d7a14a);
        outline-offset: 4px;
        border-radius: 0.5rem;
        padding: 1rem;
      }
      .leos-golive-card__meta {
        flex: 1;
        min-width: 12rem;
      }
      .leos-golive-card__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }
    `,
  ],
})
export class SetupGolivePageComponent implements OnInit {
  copied = false;
  publicOrigin = '';
  selected =
    (() => {
      try {
        const raw = localStorage.getItem('leos.studio.config');
        if (raw) {
          const cfg = JSON.parse(raw) as { token?: string };
          return cfg.token ?? 'qr-demo-restaurant';
        }
      } catch {
        /* ignore */
      }
      return 'qr-demo-restaurant';
    })();

  readonly tokens = [
    { token: 'qr-demo-restaurant', label: 'Restaurant' },
    { token: 'qr-demo-cafe', label: 'Café · Harbor Roast' },
    { token: 'qr-demo-hotel', label: 'Hotel' },
    { token: 'qr-demo-festival', label: 'Festival' },
    { token: 'qr-demo-airport', label: 'Airport' },
    { token: 'qr-demo-healthcare', label: 'Healthcare' },
  ];

  ngOnInit() {
    void resolvePublicWebOrigin().then((origin) => {
      this.publicOrigin = origin;
    });
  }

  entryUrl(token: string): string {
    const origin = this.publicOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
    return entryUrlForToken(origin, token);
  }

  select(t: { token: string; label: string }) {
    this.selected = t.token;
    this.persistConfig(t.token, t.label);
  }

  persistBeforeLive(ev: Event) {
    if (!this.selected) {
      ev.preventDefault();
      return;
    }
    const t = this.tokens.find((x) => x.token === this.selected);
    this.persistConfig(this.selected, t?.label ?? 'Venue');
  }

  private persistConfig(token: string, label: string) {
    let venueName = label;
    let placeCode = 'Place';
    try {
      const raw = localStorage.getItem('leos.studio.config');
      if (raw) {
        const cfg = JSON.parse(raw) as { venueName?: string; placeCode?: string };
        venueName = cfg.venueName ?? venueName;
        placeCode = cfg.placeCode ?? placeCode;
      }
    } catch {
      /* seed */
    }
    localStorage.setItem(
      'leos.studio.config',
      JSON.stringify({ venueName, placeCode, token, packId: localStorage.getItem('leos.studio.pack') }),
    );
  }

  copy(value: string) {
    void navigator.clipboard.writeText(value).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2500);
    });
  }
}
