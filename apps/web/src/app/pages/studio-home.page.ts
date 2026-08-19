import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { StudioContextService } from '../services/studio-context.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { LeosApiService } from '../services/leos-api.service';
import { SETUP_STEPS, experienceLabel, getExperience } from '../studio/experience-registry';
import { enabledPlaces } from '../studio/place-sections';

type TodayRow = { label: string; value: string; ok?: boolean };

/**
 * Studio Home — readiness front door (Design System v1).
 * Never dashboards · never % complete · rewards readiness.
 */
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="studio-home studio-motion-appear">
      @if (empty) {
        <header class="studio-home__hero">
          <p class="studio-home__greeting">{{ greeting }}</p>
          <h1 class="studio-home__venue">Your Studio</h1>
          <p class="studio-home__readiness">Let’s create your first experience.</p>
        </header>
        <div class="studio-home__doors">
          <a class="leos-btn leos-btn--primary" routerLink="/studio/welcome">Create your first experience</a>
        </div>
      } @else {
        <header class="studio-home__hero">
          <p class="studio-home__greeting">{{ greeting }}</p>
          <h1 class="studio-home__venue">{{ venue }}</h1>
          <p class="studio-home__readiness" [class.studio-home__readiness--ok]="live && readinessOk">
            {{ readiness }}
          </p>
        </header>

        <section class="studio-home__today" aria-label="Today’s Experience">
          <p class="studio-home__today-label">Today’s Experience</p>
          @for (row of todayRows; track row.label) {
            <div class="studio-home__today-row">
              <span class="studio-home__today-k">{{ row.label }}</span>
              <span class="studio-home__today-v" [class.studio-home__today-v--ok]="row.ok === true">{{
                row.value
              }}</span>
            </div>
          }
        </section>

        <div class="studio-home__doors">
          @if (live) {
            <a class="leos-btn leos-btn--primary" routerLink="/studio/setup/golive">Open Experience</a>
            <div class="studio-home__door-row">
              <a class="studio-home__door" routerLink="/studio/operate">Operate</a>
              <span class="studio-home__door-sep" aria-hidden="true">·</span>
              <a class="studio-home__door" routerLink="/studio/grow">Grow</a>
            </div>
          } @else {
            <a class="leos-btn leos-btn--primary" [routerLink]="resumeLink">{{ primaryCta }}</a>
            <div class="studio-home__door-row">
              <a class="studio-home__door" routerLink="/studio/operate">Operate</a>
              <span class="studio-home__door-sep" aria-hidden="true">·</span>
              <a class="studio-home__door" routerLink="/studio/grow">Grow</a>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class StudioHomePageComponent implements OnInit {
  private readonly ctx = inject(StudioContextService);
  private readonly auth = inject(StudioAuthService);
  private readonly api = inject(LeosApiService);

  greeting = 'Good afternoon.';
  venue = '';
  readiness = '';
  readinessOk = false;
  empty = false;
  live = false;
  primaryCta = 'Continue setup';
  resumeLink = '/studio/setup/identity';
  todayRows: TodayRow[] = [];

  ngOnInit() {
    this.ctx.touchLastSeen();
    const hour = new Date().getHours();
    const base =
      hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.';
    this.greeting = base;

    const displayName = this.auth.read().name;
    if (displayName) {
      const first = displayName.trim().split(/\s+/)[0];
      this.greeting =
        hour < 12
          ? `Good morning, ${first}.`
          : hour < 18
            ? `Good afternoon, ${first}.`
            : `Good evening, ${first}.`;
    }

    if (!this.ctx.hasExperiences()) {
      this.empty = true;
      return;
    }

    // Returning owner Continuity — venue is the hero (Blueprint Home).
    const c = this.ctx.readConfig();
    const active = this.ctx.activeExperience();
    this.live = c.live;
    this.venue = this.ctx.displayVenue() || experienceLabel(c.typeId);
    if (this.live && this.venue) {
      // Prefer venue warmth over first-name when already live
      const hello =
        hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      this.greeting = `${hello}.`;
    }
    const def = getExperience(c.typeId);
    const station = def?.terminology.station ?? 'Kitchen';
    const placeNoun = def?.terminology.place ?? 'place';
    const placePlural = def?.defaults.placeLabel ?? `${placeNoun}s`;
    const placesSet = !!(
      active?.placeCodes?.length ||
      (active?.placeSections && enabledPlaces(active.placeSections).length > 0)
    );

    if (c.live) {
      this.readiness = 'Everything is ready.';
      this.readinessOk = true;
      this.todayRows = [
        { label: 'Guests', value: 'Ready for the next guest', ok: true },
        { label: station, value: 'Ready', ok: true },
        {
          label: 'Payments',
          value: c.paymentsDone ? 'Healthy' : 'Still to finish',
          ok: c.paymentsDone,
        },
      ];
      this.api
        .listFloorTables()
        .pipe(catchError(() => of({ tables: [] })))
        .subscribe(({ tables }) => {
          const open = tables.length;
          const help = tables.reduce((n, t) => n + (t.helpCount ?? 0), 0);
          const prep = tables.reduce(
            (n, t) => n + (t.preparingCount ?? 0) + (t.pendingCount ?? 0),
            0,
          );
          const ready = tables.reduce((n, t) => n + (t.readyCount ?? 0), 0);

          const guestValue =
            open === 0
              ? 'Ready for the next guest'
              : open === 1
                ? `1 ${placeNoun.toLowerCase()} open`
                : `${open} ${placePlural.toLowerCase()} open`;

          let stationValue = 'Ready';
          if (help > 0) stationValue = help === 1 ? '1 needs help' : `${help} need help`;
          else if (ready > 0) stationValue = ready === 1 ? '1 ready' : `${ready} ready`;
          else if (prep > 0) stationValue = prep === 1 ? '1 in progress' : `${prep} in progress`;

          this.todayRows = [
            { label: 'Guests', value: guestValue, ok: help === 0 },
            { label: station, value: stationValue, ok: help === 0 && prep === 0 },
            {
              label: 'Payments',
              value: c.paymentsDone ? 'Healthy' : 'Still to finish',
              ok: c.paymentsDone,
            },
          ];

          if (help > 0) {
            this.readiness = 'Guests need a moment of help.';
            this.readinessOk = false;
          } else {
            this.readiness = 'Everything is ready.';
            this.readinessOk = true;
          }
        });
      return;
    }

    const progress = this.ctx.setupProgress();
    const next = progress.current === 'done' ? 'golive' : progress.current;
    const nextTitle = SETUP_STEPS.find((s) => s.slug === next)?.title ?? 'Go Live';
    this.resumeLink = this.ctx.pathForStep(next);
    this.primaryCta = next === 'golive' ? 'Go live' : 'Continue setup';

    const allReady = progress.done >= progress.total - 1;
    this.readiness = allReady
      ? 'You’re ready to welcome guests.'
      : 'Almost ready to welcome guests.';
    this.readinessOk = false;

    this.todayRows = [
      { label: 'Next', value: nextTitle, ok: false },
      {
        label: 'Where guests join',
        value: placesSet ? 'Set' : 'Still to finish',
        ok: placesSet,
      },
      {
        label: 'How guests pay',
        value: c.paymentsDone ? 'Healthy' : 'Still to finish',
        ok: c.paymentsDone,
      },
    ];
  }
}
