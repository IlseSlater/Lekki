import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudioContextService } from '../services/studio-context.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { LeosApiService } from '../services/leos-api.service';
import { getExperience, type ExperienceTypeId } from '../studio/experience-registry';
import { composeGrowBreath } from '../studio/grow-breath';
import { composePayoutCopy } from '../studio/grow-payouts';
import { composeFeedbackCopy } from '../studio/grow-feedback';
import { answersDoorLabel, composeAnswersConfirm, ANSWERS_ERROR } from '../studio/grow-answers';
import { PayoutsSheetComponent } from '../leos/payouts-sheet.component';
import { FeedbackSheetComponent } from '../leos/feedback-sheet.component';

/**
 * Studio Grow — trusted manager, not Excel.
 * One breath: greeting · one story · one figure · one suggestion.
 * Doors: takings sheet · feedback sheet (S-15 / S-16) · answers, no sheet (S-17).
 */
@Component({
  standalone: true,
  imports: [RouterLink, PayoutsSheetComponent, FeedbackSheetComponent],
  template: `
    <div class="studio-grow studio-motion-appear">
      <header class="studio-grow__hero">
        <p class="studio-grow__eyebrow">Grow</p>
        <h1 class="studio-grow__title">{{ venue }}</h1>
        @if (!live) {
          <p class="studio-grow__calm">Go live first. Memory fills in after you welcome guests.</p>
        } @else if (loading) {
          <p class="studio-grow__calm">Gathering today’s story…</p>
        } @else if (error) {
          <div class="studio-grow__empty" role="alert">
            <p class="studio-grow__calm">{{ error }}</p>
            <p class="studio-grow__empty-hint">
              Grow needs the API. Start the runtime, then come back — or return to Operate.
            </p>
          </div>
        } @else {
          <p class="studio-grow__calm">{{ greeting }}</p>
          <p class="studio-grow__story">{{ welcomeLine }}</p>
          @if (tradingLine) {
            <p class="studio-grow__story studio-grow__story--trade">{{ tradingLine }}</p>
          }
          @if (favouriteLine) {
            <p class="studio-grow__story studio-grow__story--soft">{{ favouriteLine }}</p>
          }
          @if (showWait) {
            <p class="studio-grow__wait-label">Average wait</p>
            <p class="studio-grow__wait">{{ waitLine }}</p>
          }
          @if (healthLine) {
            <p class="studio-grow__health">{{ healthLine }}</p>
          }
          <p
            class="studio-grow__delight"
            [class.studio-grow__delight--soft]="!delighted"
          >
            {{ delightLine }}
          </p>
        }
      </header>

      @if (live && !loading && !error) {
        <section class="studio-grow__suggest studio-motion-appear-delay" aria-label="One suggestion">
          <p class="studio-grow__suggest-label">One suggestion</p>
          <p class="studio-grow__suggest-body">{{ suggestion }}</p>
        </section>

        <button type="button" class="studio-grow__payouts-link" (click)="openFeedback()">
          How guests felt →
        </button>
        <button type="button" class="studio-grow__payouts-link" (click)="openPayouts()">
          See what you've taken →
        </button>
        @for (period of answersPeriods; track period) {
          <button
            type="button"
            class="studio-grow__payouts-link"
            [disabled]="answersBusy === period"
            (click)="requestAnswers(period)"
          >
            {{ answersButtonLabel(period) }}
          </button>
          @if (answersError[period]) {
            <p class="studio-grow__answers-error" role="alert">{{ answersError[period] }}</p>
          }
        }
      }

      <div class="studio-grow__doors studio-motion-appear-delay-2">
        @if (live) {
          <a class="leos-btn leos-btn--primary studio-grow__cta" routerLink="/studio/operate">
            Back to Operate
          </a>
        } @else {
          <a class="leos-btn leos-btn--primary studio-grow__cta" routerLink="/studio">Continue setup</a>
        }
      </div>
    </div>

    <leos-payouts-sheet
      [open]="payoutsOpen"
      [loading]="payoutsLoading"
      [error]="payoutsError"
      [totalLine]="payoutsTotalLine"
      [cadenceLine]="payoutsCadenceLine"
      (dismiss)="payoutsOpen = false"
    />

    <leos-feedback-sheet
      [open]="feedbackOpen"
      [loading]="feedbackLoading"
      [error]="feedbackError"
      [sentimentLine]="feedbackSentimentLine"
      [flaggedLine]="feedbackFlaggedLine"
      [canReply]="feedbackCanReply"
      [replyBusy]="feedbackReplyBusy"
      [replyLabel]="feedbackReplyLabel"
      (dismiss)="feedbackOpen = false"
      (heard)="markFeedbackHeard()"
    />
  `,
  styles: [
    `
      .studio-grow__payouts-link {
        display: block;
        margin: 0.5rem 0 0;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--studio-ink-secondary, #6b7280);
        font: inherit;
        font-size: 0.9rem;
        text-align: left;
        cursor: pointer;
      }
      .studio-grow__payouts-link:hover {
        color: var(--studio-ink, #1b2230);
      }
      .studio-grow__answers-error {
        margin: 0.25rem 0 0;
        font-size: 0.85rem;
        color: var(--studio-danger, #b3452c);
      }
    `,
  ],
})
export class StudioGrowPageComponent implements OnInit {
  private readonly ctx = inject(StudioContextService);
  private readonly auth = inject(StudioAuthService);
  private readonly api = inject(LeosApiService);

  greeting = 'Good evening.';
  venue = 'Your experience';
  live = false;
  loading = true;
  error = '';
  welcomeLine = '';
  tradingLine = '';
  favouriteLine = '';
  waitLine = '';
  showWait = false;
  healthLine = '';
  delightLine = 'Guests were delighted.';
  delighted = true;
  suggestion = 'Keep tonight calm — you’re ready for the next guest.';

  payoutsOpen = false;
  payoutsLoading = false;
  payoutsError = '';
  payoutsTotalLine = '';
  payoutsCadenceLine = '';

  feedbackOpen = false;
  feedbackLoading = false;
  feedbackError = '';
  feedbackSentimentLine = '';
  feedbackFlaggedLine = '';
  feedbackCanReply = false;
  feedbackReplyBusy = false;
  feedbackReplyLabel = 'Got it';
  private feedbackFlaggedId: string | null = null;

  readonly answersPeriods: Array<'week' | 'month'> = ['week', 'month'];
  answersBusy: 'week' | 'month' | null = null;
  answersConfirm: Record<'week' | 'month', string> = { week: '', month: '' };
  answersError: Record<'week' | 'month', string> = { week: '', month: '' };

  private typeId: ExperienceTypeId = 'restaurant';
  private hour = 12;
  private venueId: string | null = null;

  ngOnInit() {
    this.hour = new Date().getHours();
    this.greeting =
      this.hour < 12 ? 'Good morning.' : this.hour < 18 ? 'Good afternoon.' : 'Good evening.';

    const displayName = this.auth.read().name;
    if (displayName) {
      const first = displayName.trim().split(/\s+/)[0];
      this.greeting =
        this.hour < 12
          ? `Good morning, ${first}.`
          : this.hour < 18
            ? `Good afternoon, ${first}.`
            : `Good evening, ${first}.`;
    }

    const c = this.ctx.readConfig();
    this.venue = this.ctx.displayVenue();
    this.live = c.live;
    this.typeId = (c.typeId || 'restaurant') as ExperienceTypeId;

    if (!this.live) {
      this.loading = false;
      return;
    }

    this.api.getGrowOverview(c.token || undefined).subscribe({
      next: (o) => {
        this.loading = false;
        if (o.venueName) this.venue = o.venueName;
        this.venueId = o.venueId ?? null;
        const def = getExperience(this.typeId);
        const breath = composeGrowBreath({
          guestsToday: o.guestsToday,
          guestsYesterday: o.guestsYesterday,
          takingsToday: o.takingsToday ?? 0,
          takingsYesterday: o.takingsYesterday ?? 0,
          currency: o.currency || 'ZAR',
          popularLabel: o.popularLabel ?? null,
          waitToday: o.waitToday ?? (o.guestsToday > 0 ? o.averageWaitMinutes : null),
          waitYesterday:
            o.waitYesterday ?? (o.guestsToday > 0 ? null : o.averageWaitMinutes),
          paymentsStatus: o.paymentsStatus ?? null,
          hasMemory: o.hasMemory,
          hour: this.hour,
          venue: this.venue,
          nouns: {
            placePlural: def?.defaults.placeLabel ?? 'Tables',
            station: def?.terminology.station ?? 'Kitchen',
            participant: def?.terminology.participant ?? 'Guest',
            transaction: def?.terminology.transaction ?? 'Order',
          },
        });
        this.welcomeLine = breath.welcomeLine;
        this.tradingLine = breath.tradingLine;
        this.favouriteLine = breath.favouriteLine;
        this.waitLine = breath.waitLine;
        this.showWait = breath.showWait;
        this.healthLine = breath.healthLine;
        this.delightLine = breath.delightLine;
        this.delighted = breath.delighted;
        this.suggestion = breath.suggestion;
        this.applyFeedbackBreath();
      },
      error: () => {
        this.loading = false;
        this.error = 'Couldn’t load today’s story — try again shortly.';
      },
    });
  }

  private peoplePlural(): string {
    const people = getExperience(this.typeId)?.terminology.participant ?? 'Guest';
    const base = people.charAt(0).toUpperCase() + people.slice(1);
    return people.toLowerCase().endsWith('s') ? base : `${base}s`;
  }

  private applyFeedbackBreath() {
    this.api.getGrowFeedback({ venueId: this.venueId ?? undefined, period: 'week' }).subscribe({
      next: (f) => {
        const copy = composeFeedbackCopy({
          tones: f.tones ?? [],
          flagged: f.flagged,
          participantNounPlural: this.peoplePlural(),
        });
        this.delightLine = copy.sentimentLine;
        this.delighted = copy.sentiment === 'delighted';
        this.feedbackSentimentLine = copy.sentimentLine;
        this.feedbackFlaggedLine = copy.flaggedLine;
        this.feedbackCanReply = !!f.flagged?.canReply && !!copy.flaggedLine;
        this.feedbackReplyLabel = copy.replyLabel;
        this.feedbackFlaggedId = f.flagged?.id ?? null;
      },
      error: () => {
        /* keep heuristic delight if feedback endpoint fails */
      },
    });
  }

  openFeedback() {
    this.feedbackOpen = true;
    if (this.feedbackSentimentLine || this.feedbackLoading) return;
    this.feedbackLoading = true;
    this.feedbackError = '';
    this.api.getGrowFeedback({ venueId: this.venueId ?? undefined, period: 'week' }).subscribe({
      next: (f) => {
        this.feedbackLoading = false;
        const copy = composeFeedbackCopy({
          tones: f.tones ?? [],
          flagged: f.flagged,
          participantNounPlural: this.peoplePlural(),
        });
        this.feedbackSentimentLine = copy.sentimentLine;
        this.feedbackFlaggedLine = copy.flaggedLine;
        this.feedbackCanReply = !!f.flagged?.canReply && !!copy.flaggedLine;
        this.feedbackReplyLabel = copy.replyLabel;
        this.feedbackFlaggedId = f.flagged?.id ?? null;
        this.delightLine = copy.sentimentLine;
        this.delighted = copy.sentiment === 'delighted';
      },
      error: () => {
        this.feedbackLoading = false;
        this.feedbackError = 'Couldn’t load feedback — try again shortly.';
      },
    });
  }

  markFeedbackHeard() {
    if (!this.feedbackFlaggedId || this.feedbackReplyBusy) return;
    this.feedbackReplyBusy = true;
    this.api.markFeedbackHeard(this.feedbackFlaggedId).subscribe({
      next: () => {
        this.feedbackReplyBusy = false;
        this.feedbackCanReply = false;
        this.feedbackFlaggedLine = '';
        this.feedbackFlaggedId = null;
      },
      error: () => {
        this.feedbackReplyBusy = false;
        this.feedbackError = 'Couldn’t mark that heard — try again shortly.';
      },
    });
  }

  openPayouts() {
    this.payoutsOpen = true;
    if (this.payoutsTotalLine || this.payoutsLoading) return;
    this.payoutsLoading = true;
    this.payoutsError = '';
    this.api.getGrowPayouts({ venueId: this.venueId ?? undefined, period: 'week' }).subscribe({
      next: (p) => {
        this.payoutsLoading = false;
        const copy = composePayoutCopy({ amount: p.amount, currency: p.currency, period: p.period });
        this.payoutsTotalLine = copy.totalLine;
        this.payoutsCadenceLine = copy.cadenceLine;
      },
      error: () => {
        this.payoutsLoading = false;
        this.payoutsError = 'Couldn’t load your totals — try again shortly.';
      },
    });
  }

  answersButtonLabel(period: 'week' | 'month'): string {
    if (this.answersBusy === period) return 'Sending…';
    if (this.answersConfirm[period]) return this.answersConfirm[period];
    return answersDoorLabel(period);
  }

  requestAnswers(period: 'week' | 'month') {
    if (this.answersBusy) return;
    this.answersBusy = period;
    this.answersError[period] = '';
    this.api.requestVisitRecord({ period, venueId: this.venueId ?? undefined }).subscribe({
      next: (res) => {
        this.answersBusy = null;
        this.answersConfirm[period] = composeAnswersConfirm(res.to);
      },
      error: () => {
        this.answersBusy = null;
        this.answersError[period] = ANSWERS_ERROR;
      },
    });
  }
}
