import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { EntryQrComponent } from '../leos/entry-qr.component';
import { entryUrlForToken, resolvePublicWebOrigin } from '../services/public-origin';
import { LeosApiService } from '../services/leos-api.service';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { SETUP_STEPS, getExperience, experienceLabel } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';
import { guestCanSummary } from '../studio/guest-experience-design';
import { enabledPlaces } from '../studio/place-sections';
import { profileRuntimeForType } from '../studio/profile-runtime';

type CheckRow = { label: string; value: string; ok: boolean };

/**
 * Setup — Go Live.
 * Mint a unique entry token on load; operator confirms before marking live.
 */
@Component({
  standalone: true,
  imports: [ExperienceScreenComponent, RouterLink, EntryQrComponent, ConfidenceIndicatorComponent],
  template: `
    <leos-experience-screen [purpose]="purpose" [lead]="lead" help="" [showFooter]="true">
      <div config class="go-config">
        <p class="go-promise">
          @if (isLive) {
            Nothing changes for your guests — the experience you’ve been shaping is now live.
          } @else {
            Review your checklist, then confirm when you’re ready to go live.
          }
        </p>

        <ul class="go-check" aria-label="Ready">
          @for (row of checklist; track row.label) {
            <li class="go-check__row" [class.go-check__row--ok]="row.ok">
              <span class="go-check__mark" aria-hidden="true">{{ row.ok ? '✓' : '·' }}</span>
              <span class="go-check__label">{{ row.label }}</span>
              <span class="go-check__value">{{ row.value }}</span>
            </li>
          }
        </ul>

        @if (mintError) {
          <p class="go-error" role="alert">{{ mintError }}</p>
        }

        @if (entryUrl && isLive) {
          <leos-entry-qr #qr [value]="entryUrl" [label]="venueName" [size]="200" />
        }
        <p class="go-place">
          <strong>{{ venueName }}</strong>
          @if (placeCode) {
            · {{ placeCode }}
          }
        </p>
        @if (isLive) {
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
        }
        @if (downloaded) {
          <p class="go-flash" role="status">QR saved — place it where guests naturally look first.</p>
        }
        @if (copied) {
          <p class="go-flash" role="status">Link copied — you’ll see the same Live Experience.</p>
        }
      </div>

      <leos-confidence-indicator
        confidence
        [eyebrow]="isLive ? 'You’re live' : 'Almost there'"
        [fact]="venueName"
        [detail]="isLive ? (placeCode ? 'First guest joins · ' + placeCode : 'Ready for your first guest') : 'Confirm when your QR is ready'"
        [ready]="isLive"
        okLabel="Looks good"
      />

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/setup/payments">Back</a>
      @if (isLive) {
        <a primary class="leos-btn leos-btn--primary" routerLink="/studio/operate">Continue</a>
      } @else {
        <button
          primary
          type="button"
          class="leos-btn leos-btn--primary"
          [disabled]="minting || !entryToken"
          (click)="confirmGoLive()"
        >
          {{ minting ? 'Preparing…' : 'Go live' }}
        </button>
      }
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
      .go-error {
        margin: 0;
        color: #b42318;
        font-size: 0.875rem;
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
      }
      .go-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .go-flash {
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-success, #4f8a6b);
      }
    `,
  ],
})
export class SetupGoliveEnginePageComponent implements OnInit {
  private readonly ctx = inject(StudioContextService);
  private readonly api = inject(LeosApiService);
  private readonly staff = inject(OperateStaffSessionService);

  @ViewChild('qr') qr?: EntryQrComponent;

  purpose = SETUP_STEPS[4].title;
  lead = SETUP_STEPS[4].why;
  venueName = 'Your venue';
  placeCode = '';
  entryUrl = '';
  entryToken = '';
  isLive = false;
  minting = false;
  mintError = '';
  downloaded = false;
  copied = false;
  checklist: CheckRow[] = [];

  ngOnInit() {
    const active = this.ctx.activeExperience();
    const def = getExperience(active?.typeId);
    this.venueName = active?.venueName || def?.defaults.venueName || this.venueName;
    this.placeCode = active?.placeCode || def?.defaults.placeCode || '';
    this.isLive = !!active?.live;
    this.entryToken = active?.token || '';

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

    if (this.isLive && this.entryToken) {
      this.setEntryUrl(this.entryToken);
      return;
    }

    void this.mintEntryToken();
  }

  confirmGoLive() {
    if (!this.entryToken) return;
    this.ctx.upsertActive({ token: this.entryToken, live: true });
    this.ctx.markStep('golive');
    this.isLive = true;
    this.setEntryUrl(this.entryToken);
  }

  private async mintEntryToken() {
    const active = this.ctx.activeExperience();
    const staff = this.staff.read();
    if (!staff?.organisationId) {
      this.mintError = 'Sign in to Studio staff before going live.';
      return;
    }

    this.minting = true;
    this.mintError = '';

    try {
      let venueId = active?.venueId?.trim() || '';
      let physicalContextId = active?.physicalContextId?.trim() || '';
      let profileId = profileRuntimeForType(active?.typeId || 'restaurant').profileId;
      let profileVersion = profileRuntimeForType(active?.typeId || 'restaurant').profileVersion;

      try {
        const ctx = await new Promise<{
          venueId: string;
          physicalContextId: string;
          profileId: string;
          profileVersion: string;
          placeCode: string;
        }>((resolve, reject) => {
          this.api
            .resolveSetupEntryContext(active?.placeCode || this.placeCode || undefined)
            .subscribe({ next: resolve, error: reject });
        });
        venueId = ctx.venueId;
        physicalContextId = ctx.physicalContextId;
        profileId = ctx.profileId;
        profileVersion = ctx.profileVersion;
        if (ctx.placeCode) this.placeCode = ctx.placeCode;
      } catch {
        const overview = await new Promise<{ venueId?: string | null }>((resolve, reject) => {
          this.api.getGrowOverview().subscribe({ next: resolve, error: reject });
        });
        if (overview.venueId) venueId = overview.venueId;

        if (!physicalContextId && active?.token) {
          const bootstrap = await new Promise<{
            session: { physicalContextId?: string; venueId: string };
          }>((resolve, reject) => {
            this.api
              .resolveEntry({ token: active!.token, displayName: 'Studio setup' })
              .subscribe({ next: resolve, error: reject });
          });
          physicalContextId = bootstrap.session.physicalContextId || '';
          if (!venueId) venueId = bootstrap.session.venueId;
        }
      }

      if (!venueId || !physicalContextId) {
        this.mintError = 'Venue places aren’t ready yet — finish Places setup first.';
        this.minting = false;
        return;
      }

      const minted = await new Promise<{ token: string }>((resolve, reject) => {
        this.api
          .mintEntryToken({
            organisationId: staff.organisationId,
            venueId,
            physicalContextId,
            profileId,
            profileVersion,
          })
          .subscribe({ next: resolve, error: reject });
      });

      this.entryToken = minted.token;
      this.ctx.upsertActive({
        token: minted.token,
        venueId,
        organisationId: staff.organisationId,
        physicalContextId,
        live: false,
      });
    } catch {
      this.mintError = 'Couldn’t mint your entry QR — check staff sign-in and try again.';
    } finally {
      this.minting = false;
    }
  }

  private setEntryUrl(token: string) {
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
