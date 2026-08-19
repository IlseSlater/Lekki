import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { EntryQrComponent } from '../leos/entry-qr.component';
import { entryUrlForToken, resolvePublicWebOrigin } from '../services/public-origin';
import { SETUP_STEPS, getExperience, experienceLabel } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';
import { guestCanSummary } from '../studio/guest-experience-design';
import { enabledPlaces } from '../studio/place-sections';

type CheckRow = { label: string; value: string; ok: boolean };

/**
 * Setup — Go Live.
 * Inevitable: same Live Experience, now public. Design System v1 anatomy.
 */
@Component({
  standalone: true,
  imports: [ExperienceScreenComponent, RouterLink, EntryQrComponent, ConfidenceIndicatorComponent],
  template: `
    <leos-experience-screen [purpose]="purpose" [lead]="lead" help="" [showFooter]="true">
      <div config class="go-config">
        <p class="go-promise">Nothing changes for your guests — the experience you’ve been shaping is now live.</p>

        <ul class="go-check" aria-label="Ready">
          @for (row of checklist; track row.label) {
            <li class="go-check__row" [class.go-check__row--ok]="row.ok">
              <span class="go-check__mark" aria-hidden="true">{{ row.ok ? '✓' : '·' }}</span>
              <span class="go-check__label">{{ row.label }}</span>
              <span class="go-check__value">{{ row.value }}</span>
            </li>
          }
        </ul>

        @if (entryUrl) {
          <leos-entry-qr #qr [value]="entryUrl" [label]="venueName" [size]="200" />
        }
        <p class="go-place">
          <strong>{{ venueName }}</strong>
          @if (placeCode) {
            · {{ placeCode }}
          }
        </p>
        <div class="go-actions">
          <button type="button" class="leos-btn leos-btn--secondary" (click)="downloadQr()">
            Download QR
          </button>
          <a class="leos-btn leos-btn--secondary" [href]="entryUrl" target="_blank" rel="noopener">
            Open Experience
          </a>
          <button type="button" class="leos-btn leos-btn--secondary" (click)="copyLink()" [disabled]="!entryUrl">
            Copy link
          </button>
        </div>
        @if (downloaded) {
          <p class="go-flash" role="status">QR saved — place it where guests naturally look first.</p>
        }
        @if (copied) {
          <p class="go-flash" role="status">Link copied — you’ll see the same Live Experience.</p>
        }
      </div>

      <leos-confidence-indicator
        confidence
        eyebrow="You’re live"
        [fact]="venueName"
        [detail]="placeCode ? 'First guest joins · ' + placeCode : 'Ready for your first guest'"
        [ready]="true"
        okLabel="Looks good"
      />

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/setup/payments">Back</a>
      <a primary class="leos-btn leos-btn--primary" routerLink="/studio/operate">Continue</a>
    </leos-experience-screen>
  `,
  styles: [
    `
      .go-config {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--studio-gap-controls, 20px);
      }
      .go-promise {
        margin: 0;
        font-size: 0.9375rem;
        color: var(--studio-ink-secondary, #6b7280);
        line-height: 1.45;
        max-width: 28rem;
      }
      .go-check {
        list-style: none;
        margin: 0;
        padding: 0;
        width: 100%;
        max-width: 28rem;
      }
      .go-check__row {
        display: grid;
        grid-template-columns: 1.25rem 7rem 1fr;
        gap: 0.5rem 0.75rem;
        align-items: baseline;
        padding: 0.55rem 0;
        border-bottom: 1px solid var(--studio-line, #e7e2db);
        font-size: 0.875rem;
      }
      .go-check__mark {
        color: var(--studio-ink-tertiary, #8f96a3);
        font-weight: 700;
      }
      .go-check__row--ok .go-check__mark {
        color: var(--studio-success, #4f8a6b);
      }
      .go-check__label {
        font-weight: 650;
        color: var(--studio-ink, #1b2230);
      }
      .go-check__value {
        color: var(--studio-ink-secondary, #6b7280);
        text-align: right;
      }
      .go-config leos-entry-qr {
        display: block;
        animation: go-qr-reveal var(--studio-duration-settle, 360ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1))
          both;
      }
      @keyframes go-qr-reveal {
        from {
          opacity: 0;
          transform: scale(0.96);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .go-place {
        margin: 0;
        font-size: 0.9375rem;
        animation: studio-fade var(--studio-duration-enter, 280ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1))
          40ms both;
      }
      .go-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        animation: studio-fade var(--studio-duration-enter, 280ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1))
          80ms both;
      }
      .go-flash {
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-success, #4f8a6b);
        animation: studio-autosave var(--studio-duration-settle, 360ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1))
          both;
      }
    `,
  ],
})
export class SetupGoliveEnginePageComponent implements OnInit {
  private readonly ctx = inject(StudioContextService);

  @ViewChild('qr') qr?: EntryQrComponent;

  purpose = SETUP_STEPS[4].title;
  lead = SETUP_STEPS[4].why;
  venueName = 'Your venue';
  placeCode = '';
  entryUrl = '';
  downloaded = false;
  copied = false;
  checklist: CheckRow[] = [];

  ngOnInit() {
    const active = this.ctx.activeExperience();
    const def = getExperience(active?.typeId);
    this.venueName = active?.venueName || def?.defaults.venueName || this.venueName;
    this.placeCode = active?.placeCode || def?.defaults.placeCode || '';
    const token = active?.token || def?.defaults.token || 'qr-demo-restaurant';

    const placeCount = active?.placeSections
      ? enabledPlaces(active.placeSections).length
      : active?.placeCodes?.length ?? 0;
    const pay = this.ctx.livePayMethods();
    const payLabels = [
      pay.card ? 'Card' : '',
      pay.applePay ? 'Apple Pay' : '',
      pay.googlePay ? 'Google Pay' : '',
    ].filter(Boolean);
    const design = active?.guestDesign;
    this.checklist = [
      {
        label: 'Who you are',
        value: this.venueName + (active?.location ? ` · ${active.location}` : ''),
        ok: !!active?.venueName?.trim(),
      },
      {
        label: 'What guests experience',
        value: design ? guestCanSummary(design) : experienceLabel(active?.typeId),
        ok: !!active?.steps?.experience,
      },
      {
        label: 'Where guests join',
        value: placeCount ? `${placeCount} ready` : 'None yet',
        ok: placeCount > 0,
      },
      {
        label: 'How guests pay',
        value: payLabels.join(' · ') || 'None yet',
        ok: payLabels.length > 0,
      },
    ];

    this.ctx.upsertActive({ token, live: true });
    this.ctx.markStep('golive');

    // Immediate confidence — never leave Open Experience / QR empty while LAN resolve runs.
    const pageOrigin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';
    this.entryUrl = entryUrlForToken(pageOrigin, token);
    void resolvePublicWebOrigin().then((origin) => {
      this.entryUrl = entryUrlForToken(origin, token);
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
      setTimeout(() => (this.copied = false), 3000);
    });
  }
}
