import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudioContextService } from '../services/studio-context.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { LeosApiService } from '../services/leos-api.service';
import { getExperience, type ExperienceTypeId } from '../studio/experience-registry';
import { composeGrowBreath } from '../studio/grow-breath';

/**
 * Studio Grow — trusted manager, not Excel.
 * One breath: greeting · one story · one figure · one suggestion.
 */
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="studio-grow studio-motion-appear">
      <header class="studio-grow__hero">
        <p class="studio-grow__greeting">{{ greeting }}</p>
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

  private typeId: ExperienceTypeId = 'restaurant';
  private hour = 12;

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
      },
      error: () => {
        this.loading = false;
        this.error = 'Couldn’t load today’s story — try again shortly.';
      },
    });
  }
}
