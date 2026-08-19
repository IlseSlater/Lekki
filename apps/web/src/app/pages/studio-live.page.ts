import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { EntryQrComponent } from '../leos/entry-qr.component';
import { entryUrlForToken, resolvePublicWebOrigin } from '../services/public-origin';
import { getExperience } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';

/** Studio S5 — Live achievement (emotional Activate peak). */
@Component({
  standalone: true,
  imports: [ExperienceScreenComponent, RouterLink, EntryQrComponent],
  template: `
    <leos-experience-screen
      purpose="You’re live."
      [lead]="lead"
      help=""
      [showFooter]="true"
    >
      <div class="setup-verified leos-live-moment">
        <p class="setup-verified__title">Your experience is live</p>
        @if (entryUrl) {
          <leos-entry-qr #qr [value]="entryUrl" [label]="venueName" [size]="200" />
        }
        <p class="leos-live-moment__place">
          <strong>{{ venueName }}</strong>
          @if (placeCode) {
            · {{ placeCode }}
          }
        </p>
        @if (entryUrl) {
          <p class="leos-muted" style="font-size:0.75rem;word-break:break-all;">{{ entryUrl }}</p>
        }

        <div class="setup-verified__dl" style="margin-top:1rem;text-align:left;">
          <dt>Payments</dt>
          <dd>{{ paymentsLabel }}</dd>
          <dt>{{ placeLabel }}</dt>
          <dd>{{ placeCodes.length || 1 }} ready</dd>
        </div>

        @if (placeCodes.length > 1) {
          <div class="leos-empty" style="margin-top:1rem;text-align:left;">
            <p class="leos-muted">
              This QR opens <strong>{{ placeCode }}</strong> first.
            </p>
            <p class="leos-muted">Other live {{ placeLabel.toLowerCase() }}:</p>
            <p class="leos-muted">{{ remainingPlaces }}</p>
          </div>
        }

        <div class="leos-live-moment__actions">
          <button type="button" class="leos-btn leos-btn--secondary" (click)="downloadQr()">
            Download QR
          </button>
          <button type="button" class="leos-btn leos-btn--secondary" (click)="copyLink()" [disabled]="!entryUrl">
            Copy link
          </button>
          <a class="leos-btn leos-btn--secondary" [href]="entryUrl" target="_blank" rel="noopener">
            Open Experience
          </a>
        </div>
        @if (downloaded) {
          <p class="leos-success-banner" role="status" style="margin-top:1rem;">
            QR saved — print it and put it where guests sit.
          </p>
        }
        @if (copied) {
          <p class="leos-success-banner" role="status" style="margin-top:1rem;">
            Link copied — share with a guest on the same Wi‑Fi.
          </p>
        }
      </div>
      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio">Home</a>
      <a primary class="leos-btn leos-btn--primary" routerLink="/studio/operate">Start operating</a>
    </leos-experience-screen>
  `,
})
export class StudioLivePageComponent implements OnInit {
  private readonly ctx = inject(StudioContextService);

  @ViewChild('qr') qr?: EntryQrComponent;

  venueName = 'Your venue';
  placeLabel = 'Places';
  placeCode = 'Place';
  placeCodes: string[] = [];
  remainingPlaces = '';
  paymentsLabel = 'Not connected';
  token = 'qr-demo-restaurant';
  entryUrl = '';
  lead = 'Guests can scan this QR and walk straight into the experience.';
  downloaded = false;
  copied = false;

  ngOnInit() {
    const active = this.ctx.activeExperience();
    const def = getExperience(active?.typeId);
    const legacy = this.readLegacyConfig();

    this.venueName = active?.venueName || legacy.venueName || def?.defaults.venueName || this.venueName;
    this.placeLabel = def?.defaults.placeLabel || def?.terminology.place || this.placeLabel;
    this.placeCode = active?.placeCode || legacy.placeCode || def?.defaults.placeCode || this.placeCode;
    this.placeCodes = active?.placeCodes?.length
      ? active.placeCodes
      : [this.placeCode].filter(Boolean);
    this.remainingPlaces = this.placeCodes.filter((code) => code !== this.placeCode).join(' · ');
    this.paymentsLabel = active?.paymentsDone || legacy.paymentsDone ? 'Connected' : 'Not connected yet';
    this.token = active?.token || legacy.token || def?.defaults.token || this.token;
    this.lead = def?.setupHints.goliveLead ?? this.lead;

    this.ctx.upsertActive({ token: this.token, live: true });
    this.ctx.markStep('golive');

    void resolvePublicWebOrigin().then((origin) => {
      this.entryUrl = entryUrlForToken(origin, this.token);
    });
  }

  downloadQr() {
    const ok = this.qr?.downloadPng(`${this.venueName.replace(/\s+/g, '-').toLowerCase()}-qr.png`);
    if (ok) {
      this.downloaded = true;
      setTimeout(() => (this.downloaded = false), 3000);
    }
  }

  copyLink() {
    if (!this.entryUrl) return;
    void navigator.clipboard.writeText(this.entryUrl).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2500);
    });
  }

  private readLegacyConfig(): {
    venueName?: string;
    placeCode?: string;
    token?: string;
    paymentsDone?: boolean;
  } {
    try {
      const raw = localStorage.getItem('leos.studio.config');
      const paymentsDone = localStorage.getItem('leos.studio.payments') === '1';
      if (!raw) return { paymentsDone };
      const cfg = JSON.parse(raw) as {
        venueName?: string;
        placeCode?: string;
        token?: string;
      };
      return { ...cfg, paymentsDone };
    } catch {
      return {};
    }
  }
}
