import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudioContextService } from '../services/studio-context.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { LeosApiService } from '../services/leos-api.service';
import { getExperience, type ExperienceTypeId } from '../studio/experience-registry';

/**
 * Studio Grow — trusted manager, not Excel.
 * Hospitality Phase. Almost invisible.
 * Calm trading breath: one figure in prose — never a revenue grid.
 * Pack nouns from experience registry (Continuity with Operate / Guest).
 */
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="studio-grow studio-motion-appear">
      <header class="studio-grow__hero">
        <p class="studio-grow__greeting">{{ greeting }}</p>
        @if (live && venue) {
          <p class="studio-grow__venue">{{ venue }}</p>
        }
        @if (!live) {
          <p class="studio-grow__story">Go live first. Memory fills in after you welcome guests.</p>
        } @else if (loading) {
          <p class="studio-grow__story">Gathering today’s story…</p>
        } @else if (error) {
          <p class="studio-grow__story" role="alert">{{ error }}</p>
        } @else {
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
      }

      <div class="studio-grow__doors studio-motion-appear-delay-2">
        @if (live) {
          <a class="leos-btn leos-btn--primary" routerLink="/studio/operate">Back to Operate</a>
        } @else {
          <a class="leos-btn leos-btn--primary" routerLink="/studio">Continue setup</a>
        }
      </div>
    </div>
  `,
})
export class StudioGrowPageComponent implements OnInit {
  private readonly ctx = inject(StudioContextService);
  private readonly api = inject(LeosApiService);
  private readonly auth = inject(StudioAuthService);

  greeting = 'Good evening.';
  venue = 'Your experience';
  live = false;
  loading = true;
  error = '';
  guestsToday: number | null = null;
  guestsYesterday: number | null = null;
  averageWaitMinutes: number | null = null;
  hasMemory = false;
  takingsToday = 0;
  takingsYesterday = 0;
  currency = 'ZAR';
  popularLabel: string | null = null;
  paymentsStatus: 'healthy' | 'setup' | null = null;
  welcomeLine = '';
  tradingLine = '';
  favouriteLine = '';
  waitLine = '';
  showWait = false;
  healthLine = '';
  delightLine = 'Guests were delighted.';
  delighted = true;
  suggestion = 'Keep tonight calm — you’re ready for the next guest.';

  private placeNoun = 'Table';
  private placeNounPlural = 'Tables';
  private stationNoun = 'Kitchen';
  private participantNoun = 'Guest';
  private transactionNoun = 'Order';
  private hour = 12;

  ngOnInit() {
    this.hour = new Date().getHours();
    const base =
      this.hour < 12 ? 'Good morning.' : this.hour < 18 ? 'Good afternoon.' : 'Good evening.';
    this.greeting = base;

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

    const typeId = (c.typeId || 'restaurant') as ExperienceTypeId;
    const def = getExperience(typeId);
    this.placeNoun = def?.terminology.place ?? 'Table';
    this.placeNounPlural = def?.defaults.placeLabel ?? `${this.placeNoun}s`;
    this.stationNoun = def?.terminology.station ?? 'Kitchen';
    this.participantNoun = def?.terminology.participant ?? 'Guest';
    this.transactionNoun = def?.terminology.transaction ?? 'Order';

    if (!this.live) {
      this.loading = false;
      return;
    }

    this.api.getGrowOverview(c.token || undefined).subscribe({
      next: (o) => {
        this.loading = false;
        this.guestsYesterday = o.guestsYesterday;
        this.guestsToday = o.guestsToday;
        this.averageWaitMinutes = o.averageWaitMinutes;
        this.hasMemory = o.hasMemory;
        this.takingsToday = o.takingsToday ?? 0;
        this.takingsYesterday = o.takingsYesterday ?? 0;
        this.currency = o.currency || 'ZAR';
        this.popularLabel = o.popularLabel ?? null;
        this.paymentsStatus = o.paymentsStatus ?? null;
        if (o.venueName) this.venue = o.venueName;
        this.compose();
      },
      error: () => {
        this.loading = false;
        this.error = 'Couldn’t load today’s story — try again shortly.';
      },
    });
  }

  private compose() {
    const people = this.participantNoun.toLowerCase();
    const peoplePlural = people.endsWith('s') ? people : `${people}s`;
    const txnVerb = this.transactionVerb();
    const places = this.placeNounPlural;
    const station = this.stationNoun.toLowerCase();

    /** One story window — prefer today when it has guests or takings. */
    const useToday =
      (this.guestsToday != null && this.guestsToday > 0) ||
      (this.takingsToday > 0 && !(this.guestsYesterday != null && this.guestsYesterday > 0));

    const count = useToday
      ? this.guestsToday != null && this.guestsToday > 0
        ? this.guestsToday
        : null
      : this.guestsYesterday != null && this.guestsYesterday > 0
        ? this.guestsYesterday
        : null;

    const when = useToday ? 'today' : 'yesterday';
    const takings = useToday
      ? this.takingsToday
      : this.takingsYesterday > 0
        ? this.takingsYesterday
        : this.takingsToday;
    const takingsWhen = useToday
      ? this.hour >= 17
        ? 'Tonight'
        : 'Today'
      : 'Yesterday';

    if (count != null) {
      this.welcomeLine = `You welcomed ${count} ${count === 1 ? people : peoplePlural} ${when}.`;
      this.favouriteLine = this.popularLabel
        ? `Most ${peoplePlural} ${txnVerb} the ${this.popularLabel}.`
        : '';
    } else {
      this.welcomeLine = `${this.venue} is live — quiet so far.`;
      this.favouriteLine = '';
    }

    if (takings > 0) {
      const formatted = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: this.currency || 'ZAR',
        maximumFractionDigits: 0,
      }).format(takings);
      this.tradingLine = `${takingsWhen} you took ${formatted}.`;
    } else {
      this.tradingLine = '';
    }

    this.showWait = this.averageWaitMinutes != null;
    if (this.averageWaitMinutes == null) {
      this.waitLine = '';
    } else if (this.averageWaitMinutes < 1) {
      this.waitLine = 'Under a minute';
    } else {
      this.waitLine = `${this.averageWaitMinutes} minute${this.averageWaitMinutes === 1 ? '' : 's'}`;
    }

    this.healthLine =
      this.paymentsStatus === 'healthy'
        ? 'Payments healthy.'
        : this.paymentsStatus === 'setup'
          ? 'Payments still to finish.'
          : '';

    const waitSlow =
      this.averageWaitMinutes != null && this.averageWaitMinutes >= 10;
    if (count == null) {
      this.delightLine = `You’re ready when ${peoplePlural} arrive.`;
      this.delighted = false;
    } else if (waitSlow) {
      this.delightLine = `${this.capitalize(peoplePlural)} waited a little longer.`;
      this.delighted = false;
    } else {
      this.delightLine = `${this.capitalize(peoplePlural)} were delighted.`;
      this.delighted = true;
    }

    if (waitSlow) {
      this.suggestion = `Give the ${station} more hands when the floor fills.`;
    } else if (count != null && count >= 30) {
      this.suggestion = `Busy ${when} — keep another ${station} ready for the rush.`;
    } else if (takings > 0 && (this.averageWaitMinutes ?? 0) < 8) {
      this.suggestion = `${places} moved calmly — keep this pace.`;
    } else if (!this.hasMemory) {
      this.suggestion = `Welcome a few more ${peoplePlural} — memory gets clearer with each night.`;
    } else if (this.paymentsStatus === 'setup') {
      this.suggestion = 'Finish payments when you have a quiet moment.';
    } else {
      this.suggestion = useToday
        ? 'Keep the pace as calm as it felt today.'
        : 'Keep the pace as calm as yesterday felt.';
    }
  }

  /** Pack-aware verb for favourite line (ordered / requested / …). */
  private transactionVerb(): string {
    const t = this.transactionNoun.toLowerCase();
    if (t.includes('request')) return 'requested';
    if (t.includes('order')) return 'ordered';
    return `chose`;
  }

  private capitalize(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
