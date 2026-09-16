import { Component, ElementRef, OnInit, ViewChild, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { EntryQrComponent } from '../leos/entry-qr.component';
import { GoliveConfirmSheetComponent } from '../leos/golive-confirm-sheet.component';
import { entryUrlForToken, resolvePublicWebOrigin } from '../services/public-origin';
import { LeosApiService } from '../services/leos-api.service';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { SETUP_STEPS, experienceLabel, getExperience } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';
import { guestCanSummary } from '../studio/guest-experience-design';
import { profileRuntimeForType } from '../studio/profile-runtime';
import {
  canGoLive,
  gateLabel,
  staffHasStation,
  type GateCondition,
  type GateExtra,
} from '../studio/golive-gate';
import { buildGoLiveConfirm, spokenArea, type GoLiveConfirmCopy } from '../studio/golive-confirm';
import {
  missingFactCopy,
  resolveLiveFacts,
  spokenPlaceLine,
} from '../studio/live-facts';
import { enabledPlaces } from '../studio/place-sections';
import { paymentsCardState } from '../studio/pay-continuity';

/**
 * Setup — Go Live.
 * Mint a unique entry token on load; the gate, not the token, marks live.
 */
@Component({
  standalone: true,
  imports: [
    ExperienceScreenComponent,
    RouterLink,
    EntryQrComponent,
    ConfidenceIndicatorComponent,
    GoliveConfirmSheetComponent,
  ],
  template: `
    <leos-experience-screen
      [purpose]="purpose"
      [lead]="lead"
      help=""
      [showFooter]="!isLive"
    >
      <div config class="go-config">
        <p class="go-promise">
          @if (isLive) {
            Nothing changes for your guests — the experience you’ve been shaping is now live.
          } @else {
            Review your checklist, then confirm when you’re ready to go live.
          }
        </p>

        <p class="go-check-heading">Required</p>
        <ul class="go-check" aria-label="Required">
          @for (row of requiredRows; track row.id) {
            <li class="go-check__row" [class.go-check__row--ok]="row.ok">
              <span class="go-check__mark" aria-hidden="true">{{ row.ok ? '✓' : '·' }}</span>
              <span class="go-check__label">{{ row.label }}</span>
              <span class="go-check__value">{{ row.value }}</span>
            </li>
          }
        </ul>
        <p class="go-check-heading">You can open without these</p>
        <ul class="go-check go-check--extra" aria-label="Optional">
          @for (row of extraRows; track row.id) {
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
        @if (gateError) {
          <p class="go-error" role="alert">{{ gateError }}</p>
        }

        @if (entryUrl && isLive) {
          <leos-entry-qr #qr [value]="entryUrl" [label]="qrLabel" [size]="200" />
        }
        <p class="go-place">
          @if (spokenLine) {
            <strong>{{ spokenLine }}</strong>
          } @else {
            <span class="go-missing">{{ placeGap }}</span>
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
          <a class="leos-btn leos-btn--primary go-next" routerLink="/studio/operate">Open Operate</a>
          <a class="leos-btn leos-btn--secondary" routerLink="/studio/setup/payments">Back</a>
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
        [fact]="spokenLine || placeGap"
        [detail]="isLive ? (spokenLine ? 'First guest joins · ' + spokenLine : 'Ready for your first guest') : gateOk ? 'Confirm when your QR is ready' : gateError"
        [ready]="isLive"
        okLabel="Looks good"
      />

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/setup/payments">Back</a>
      @if (!isLive) {
        <button
          #goLiveBtn
          primary
          type="button"
          class="leos-btn leos-btn--primary"
          [disabled]="minting || !entryToken || !gateOk"
          (click)="askToGoLive()"
        >
          {{ minting ? 'Preparing…' : 'Go live' }}
        </button>
      }
    </leos-experience-screen>
    <leos-golive-confirm-sheet
      [open]="sheetOpen"
      [copy]="sheetCopy"
      (confirm)="confirmGoLive()"
      (dismiss)="closeSheet()"
    />
  `,
  styles: [
    `
      .go-config {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--studio-gap-controls);
      }
      .go-promise {
        margin: 0;
        font-size: 0.9375rem;
        color: var(--studio-ink-secondary);
        line-height: 1.45;
        max-width: 28rem;
      }
      .go-error {
        margin: 0;
        color: var(--leos-danger);
        font-size: 0.875rem;
      }
      .go-check {
        list-style: none;
        margin: 0;
        padding: 0;
        width: 100%;
        max-width: 28rem;
      }
      .go-check--extra {
        margin-top: 0.25rem;
        padding-top: 0;
        border-top: 0;
      }
      .go-check-heading {
        margin: 1rem 0 0.15rem;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--studio-ink-tertiary);
      }
      .go-check__row {
        display: grid;
        grid-template-columns: 1.25rem minmax(7.5rem, 38%) minmax(0, 1fr);
        gap: 0.35rem 0.85rem;
        align-items: baseline;
        padding: 0.7rem 0;
        border-bottom: 1px solid var(--studio-line);
        font-size: 0.875rem;
      }
      .go-check__mark {
        color: var(--studio-ink-tertiary);
        font-weight: 700;
      }
      .go-check__row--ok .go-check__mark {
        color: var(--studio-success);
      }
      .go-check__label {
        font-weight: 650;
        color: var(--studio-ink);
        text-wrap: pretty;
      }
      .go-check__value {
        color: var(--studio-ink-secondary);
        text-align: right;
        text-wrap: pretty;
      }
      .go-config leos-entry-qr {
        display: block;
        animation: go-qr-reveal var(--studio-duration-settle) var(--studio-ease) both;
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
      .go-missing {
        color: var(--studio-ink-secondary);
      }
      .go-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }
      .go-next {
        margin-top: 0.35rem;
      }
      .go-flash {
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-success);
      }
    `,
  ],
})
export class SetupGoliveEnginePageComponent implements OnInit {
  private readonly ctx = inject(StudioContextService);
  private readonly api = inject(LeosApiService);
  private readonly staff = inject(OperateStaffSessionService);

  @ViewChild('qr') qr?: EntryQrComponent;
  @ViewChild('goLiveBtn') goLiveBtn?: ElementRef<HTMLButtonElement>;

  purpose = SETUP_STEPS[4].title;
  lead = SETUP_STEPS[4].why;
  venueName = '';
  placeCode = '';
  spokenLine = '';
  placeGap = missingFactCopy('venueName');
  qrLabel = '';
  entryUrl = '';
  entryToken = '';
  isLive = false;
  minting = false;
  mintError = '';
  gateError = '';
  gateOk = false;
  downloaded = false;
  copied = false;
  requiredRows: GateCondition[] = [];
  extraRows: GateExtra[] = [];
  sheetOpen = false;
  sheetCopy: GoLiveConfirmCopy | null = null;
  private stationStaff = 0;

  constructor() {
    effect(() => {
      this.ctx.liveRevision();
      this.ctx.liveSession();
      this.refreshFromFacts();
    });
  }

  ngOnInit() {
    const active = this.ctx.activeExperience();
    this.isLive = !!active?.live;
    this.entryToken = active?.token || '';
    this.loadStationStaff();
    this.ctx.loadLiveSession({ venueId: active?.venueId, placeCode: active?.placeCode });
    this.refreshFromFacts();

    if (this.isLive && this.entryToken) {
      this.setEntryUrl(this.entryToken);
      return;
    }

    void this.mintEntryToken();
  }

  askToGoLive() {
    if (!this.entryToken) return;
    const gate = canGoLive([...this.requiredRows, ...this.extraRows]);
    if (!gate.ok) {
      this.gateError = this.blockingCopy(gate.blocking);
      return;
    }
    this.sheetCopy = this.buildSheetCopy();
    if (!this.sheetCopy) {
      this.gateError = 'Finish what’s missing before you go live.';
      return;
    }
    this.sheetOpen = true;
  }

  closeSheet() {
    this.sheetOpen = false;
    queueMicrotask(() => this.goLiveBtn?.nativeElement.focus());
  }

  confirmGoLive() {
    if (!this.entryToken) return;
    const gate = canGoLive([...this.requiredRows, ...this.extraRows]);
    if (!gate.ok) {
      this.gateError = this.blockingCopy(gate.blocking);
      this.closeSheet();
      return;
    }
    if (!this.buildSheetCopy()) {
      this.gateError = 'Finish what’s missing before you go live.';
      this.closeSheet();
      return;
    }
    this.ctx.upsertActive({ token: this.entryToken, live: true });
    this.ctx.markStep('golive');
    this.isLive = true;
    this.gateError = '';
    this.sheetOpen = false;
    this.setEntryUrl(this.entryToken);
  }

  private buildSheetCopy(): GoLiveConfirmCopy | null {
    const active = this.ctx.activeExperience();
    const def = getExperience(active?.typeId);
    const station = def?.terminology.station ?? 'Kitchen';
    const places = enabledPlaces(active?.placeSections ?? []);
    const area = spokenArea(places[0]?.section || '');
    const codes = places.length
      ? places.map((p) => p.label)
      : (active?.placeCodes ?? []).filter(Boolean);
    return buildGoLiveConfirm({
      venueName: this.venueName,
      placeCodes: codes.length ? codes : this.placeCode ? [this.placeCode] : [],
      area,
      station,
      paymentsActive: this.ctx.livePaymentsActive(),
    });
  }

  private refreshFromFacts() {
    const active = this.ctx.activeExperience();
    const facts = resolveLiveFacts({
      session: this.ctx.liveSession(),
      workspace: active
        ? {
            venueName: active.venueName,
            placeCode: active.placeCode,
            placeCodes: active.placeCodes,
          }
        : null,
    });
    const venue = facts.resolved ? facts.facts.venueName : facts.partial.venueName || '';
    const place = facts.resolved ? facts.facts.placeCode : facts.partial.placeCode || '';
    const catalogue = facts.resolved ? facts.facts.catalogue : facts.partial.catalogue;
    const priced = (catalogue ?? []).filter((item) => item.priceMinor > 0);
    this.venueName = venue;
    this.placeCode = place;
    this.spokenLine = venue || place ? spokenPlaceLine({ venueName: venue, placeCode: place }) : '';
    this.qrLabel = venue;
    this.placeGap = facts.resolved
      ? ''
      : missingFactCopy(facts.missing.includes('venueName') ? 'venueName' : facts.missing[0] ?? 'placeCode');

    const session = this.ctx.liveSession();
    const sessionPlace = !!(session?.placeCode || '').trim();
    const sessionVenue = !!(session?.venueName || '').trim();

    this.requiredRows = [
      {
        id: 'venue',
        label: gateLabel('venue'),
        value: venue || missingFactCopy('venueName'),
        ok: sessionVenue,
        required: true,
      },
      {
        id: 'places',
        label: gateLabel('places'),
        value: sessionPlace ? `${place} ready` : missingFactCopy('placeCode'),
        ok: sessionPlace,
        required: true,
      },
      {
        id: 'menu',
        label: gateLabel('menu'),
        value: priced.length ? `${priced.length} priced` : missingFactCopy('catalogue'),
        ok: priced.length > 0,
        required: true,
      },
      {
        id: 'orders',
        label: gateLabel('orders'),
        value: this.stationStaff ? `${this.stationStaff} with a station` : 'No station staff yet · Add them in Team',
        ok: this.stationStaff > 0,
        required: true,
      },
    ];

    const payState = paymentsCardState(this.ctx.livePaymentsActive());
    const design = active?.guestDesign;
    this.extraRows = [
      {
        id: 'experience',
        label: 'What guests experience',
        value: design ? guestCanSummary(design) : experienceLabel(active?.typeId),
        ok: !!active?.steps?.experience,
        required: false,
      },
      {
        id: 'pay',
        label: 'How guests pay',
        value: payState.value,
        ok: payState.ok,
        required: false,
      },
    ];

    const gate = canGoLive([...this.requiredRows, ...this.extraRows]);
    this.gateOk = gate.ok;
    this.gateError = gate.ok ? '' : this.blockingCopy(gate.blocking);
  }

  private blockingCopy(blocking: ReturnType<typeof canGoLive>['blocking']): string {
    if (!blocking.length) return 'Finish what’s missing before you go live.';
    return `Can’t go live yet · ${blocking.map((id) => gateLabel(id)).join(' · ')}`;
  }

  private loadStationStaff() {
    const orgId = this.staff.read()?.organisationId || this.ctx.activeExperience()?.organisationId;
    this.api.listOperateStaff(orgId || undefined).subscribe({
      next: (members) => {
        this.stationStaff = members.filter(staffHasStation).length;
        this.ctx.touchLive();
      },
      error: () => {
        this.stationStaff = 0;
        this.ctx.touchLive();
      },
    });
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
      let mintedPlace = '';

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
        mintedPlace = ctx.placeCode;
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
        placeCode: mintedPlace || active?.placeCode,
        live: false,
      });
      this.ctx.loadLiveSession({ venueId, placeCode: mintedPlace });
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
    const slug = (this.venueName || 'venue').replace(/\s+/g, '-').toLowerCase();
    const ok = this.qr?.downloadPng(`${slug}-qr.png`);
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
