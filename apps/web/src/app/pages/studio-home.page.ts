import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { StudioContextService } from '../services/studio-context.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { LeosApiService } from '../services/leos-api.service';
import { SETUP_STEPS, experienceLabel, getExperience } from '../studio/experience-registry';
import { spokenArea } from '../studio/golive-confirm';
import { recessedGateLine } from '../studio/hub-recession';
import { stationGlanceLine } from '../studio/operate-glance';
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
          <p class="studio-home__eyebrow">Setup</p>
          <h1 class="studio-home__venue">Your Studio</h1>
          <p class="studio-home__readiness">Let’s create your first experience.</p>
        </header>
        <div class="studio-home__doors">
          <a class="leos-btn leos-btn--primary" routerLink="/studio/welcome">Create your first experience</a>
        </div>
      } @else {
        <header class="studio-home__hero">
          <p class="studio-home__eyebrow">{{ live ? 'Open' : 'Setup' }}</p>
          <h1 class="studio-home__venue">{{ venue }}</h1>
          <p class="studio-home__readiness" [class.studio-home__readiness--ok]="live && readinessOk">
            {{ readiness }}
          </p>
        </header>

        @if (live && recessedLine) {
          <p class="studio-home__recess">
            <span class="studio-home__recess-mark" aria-hidden="true">✓</span>
            <span>{{ recessedLine }}</span>
            <a class="studio-home__recess-review" routerLink="/studio/setup/golive">Review setup</a>
          </p>
        }

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
            <a class="leos-btn leos-btn--primary" routerLink="/studio/operate">Open Operate</a>
            <div class="studio-home__actions" aria-label="When you have a minute">
              <a class="leos-btn leos-btn--secondary" routerLink="/studio/setup/payments">Payments</a>
              <a class="leos-btn leos-btn--secondary" routerLink="/studio/menu">{{ catalogueNoun }}</a>
              <a class="leos-btn leos-btn--secondary" routerLink="/studio/setup/golive">Guest QR</a>
            </div>
          } @else {
            <a class="leos-btn leos-btn--primary" [routerLink]="resumeLink">{{ primaryCta }}</a>
            <div class="studio-home__actions" aria-label="Optional">
              <a class="leos-btn leos-btn--secondary" routerLink="/studio/menu">{{ catalogueNoun }}</a>
              <a class="leos-btn leos-btn--secondary" routerLink="/studio/setup/payments">Payments</a>
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
  recessedLine = '';
  catalogueNoun = 'Menu';

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
    this.catalogueNoun = def?.terminology.catalogue ?? 'Menu';
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
      const floorPlaces = enabledPlaces(active?.placeSections ?? []);
      const area = spokenArea(floorPlaces[0]?.section || '');
      this.recessedLine =
        recessedGateLine({
          area,
          placeCount: floorPlaces.length || (active?.placeCodes?.length ?? 0),
          placeNoun,
          station,
        }) ?? '';
      this.todayRows = [
        { label: 'Guests', value: 'Ready for the next guest', ok: true },
        { label: station, value: `${station} is calm`, ok: true },
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

          const glance = stationGlanceLine(station, {
            waiting: help,
            preparing: prep,
            ready,
          });

          this.todayRows = [
            { label: 'Guests', value: guestValue, ok: help === 0 },
            { label: station, value: glance.line, ok: glance.tone === 'calm' },
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
