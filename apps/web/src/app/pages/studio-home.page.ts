import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { StudioContextService } from '../services/studio-context.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { LeosApiService, type GuestNoteRow } from '../services/leos-api.service';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { STUDIO_PERMISSIONS, grants } from '../studio/studio-roles';
import { studioPathAllowed } from '../studio/studio-nav';
import { FormsModule } from '@angular/forms';
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
  imports: [RouterLink, FormsModule],
  template: `
    <div class="studio-home studio-motion-appear">
      @if (empty) {
        <header class="studio-home__hero">
          <h1 class="studio-home__venue">Your Studio</h1>
          <p class="studio-home__readiness">Let’s create your first experience.</p>
        </header>
        <div class="studio-home__doors">
          <a class="leos-btn leos-btn--primary" routerLink="/studio/welcome">Create your first experience</a>
        </div>
      } @else {
        <header class="studio-home__hero">
          <h1 class="studio-home__venue">{{ venue }}</h1>
          <p class="studio-home__readiness" [class.studio-home__readiness--ok]="live && readinessOk">
            {{ readiness }}
          </p>
        </header>

        @if (live && evening) {
          <p class="studio-home__readiness" role="status">{{ evening }}</p>
        }

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

        @if (notes.length) {
          <section class="studio-home__today" aria-label="Private notes from guests">
            <p class="studio-home__today-label">Told to you privately</p>
            @for (n of notes; track n.id) {
              <div class="studio-home__note">
                <div class="studio-home__today-row">
                  <span class="studio-home__today-k">{{ n.placeCode || 'Guest' }}</span>
                  <span class="studio-home__today-v">{{ n.body }}</span>
                </div>
                @if (n.reply) {
                  <p class="studio-home__reply">
                    <strong>{{ n.repliedBy || 'You' }} replied:</strong> {{ n.reply }}
                  </p>
                } @else if (canReply && replyingTo === n.id) {
                  <div class="studio-home__reply-form">
                    <label class="leos-field__label" [for]="'reply-' + n.id">Your reply</label>
                    <textarea
                      class="leos-field__input"
                      rows="2"
                      maxlength="500"
                      [id]="'reply-' + n.id"
                      [(ngModel)]="replyText"
                    ></textarea>
                    <p class="studio-home__reply-hint">
                      One reply. They see it on their phone while their table is still open.
                    </p>
                    @if (replyError) {
                      <p class="studio-home__reply-hint" role="alert">{{ replyError }}</p>
                    }
                    <div class="studio-home__reply-actions">
                      <button
                        type="button"
                        class="leos-btn leos-btn--primary"
                        [disabled]="replyBusy || !replyText.trim()"
                        (click)="sendReply(n)"
                      >
                        {{ replyBusy ? 'Sending…' : 'Send reply' }}
                      </button>
                      <button type="button" class="leos-btn" [disabled]="replyBusy" (click)="replyingTo = null">
                        Cancel
                      </button>
                    </div>
                  </div>
                } @else if (canReply) {
                  <button type="button" class="studio-home__reply-open" (click)="startReply(n.id)">Reply</button>
                }
              </div>
            }
          </section>
        }

        <div class="studio-home__doors">
          @if (live) {
            @if (can('/studio/operate')) {
              <a class="leos-btn leos-btn--primary" routerLink="/studio/operate">Open Operate</a>
            }
            <div class="studio-home__actions" aria-label="When you have a minute">
              @if (can('/studio/payments')) {
                <a class="leos-btn leos-btn--secondary" routerLink="/studio/payments">Payments</a>
              }
              @if (can('/studio/menu')) {
                <a class="leos-btn leos-btn--secondary" routerLink="/studio/menu">Menu</a>
              }
              @if (can('/studio/tables')) {
                <a class="leos-btn leos-btn--secondary" routerLink="/studio/tables">Tables &amp; QR</a>
              }
            </div>
          } @else if (can(resumeLink)) {
            <a class="leos-btn leos-btn--primary" [routerLink]="resumeLink">{{ primaryCta }}</a>
            <div class="studio-home__actions" aria-label="Optional">
              <a class="leos-btn leos-btn--secondary" routerLink="/studio/menu">Menu</a>
              <a class="leos-btn leos-btn--secondary" routerLink="/studio/connections">Connections</a>
            </div>
          } @else {
            <p class="studio-home__reply-hint">Your place isn’t live yet. An admin finishes setting it up.</p>
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
  private readonly staffSession = inject(OperateStaffSessionService);

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
  /** One calm evening sentence. Empty until the averages are real. */
  evening = '';
  notes: GuestNoteRow[] = [];
  replyingTo: string | null = null;
  replyText = '';
  replyBusy = false;
  replyError = '';

  private get perms(): string[] {
    return this.staffSession.session()?.permissions ?? [];
  }

  /** Managers and Admins answer private notes; Analysts and Staff read them. */
  get canReply(): boolean {
    return grants(this.perms, STUDIO_PERMISSIONS.feedbackReply);
  }

  /** Only offer doors this person's Studio role opens. */
  can(path: string): boolean {
    return studioPathAllowed(this.perms, path);
  }

  startReply(id: string) {
    this.replyingTo = id;
    this.replyText = '';
    this.replyError = '';
  }

  sendReply(note: GuestNoteRow) {
    const text = this.replyText.trim();
    if (!text || this.replyBusy) return;
    this.replyBusy = true;
    this.replyError = '';
    this.api.replyToGuestNote(note.id, text).subscribe({
      next: (r) => {
        this.notes = this.notes.map((n) =>
          n.id === note.id ? { ...n, reply: r.reply, repliedAt: r.repliedAt, repliedBy: r.repliedBy } : n,
        );
        this.replyingTo = null;
        this.replyBusy = false;
      },
      error: (err: { error?: { message?: string } }) => {
        this.replyBusy = false;
        this.replyError = err?.error?.message || 'Couldn’t send that reply. Try again.';
      },
    });
  }

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
        .eveningSentence()
        .pipe(catchError(() => of({ sentence: null })))
        .subscribe((r) => (this.evening = r.sentence ?? ''));
      this.api
        .listGuestNotes()
        .pipe(catchError(() => of([])))
        .subscribe((rows) => (this.notes = rows.slice(0, 5)));
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
    const nextTitle = SETUP_STEPS.find((s) => s.slug === next)?.title ?? 'Go live';
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
        label: 'Tables & QR',
        value: placesSet ? 'Set' : 'Still to finish',
        ok: placesSet,
      },
      {
        label: 'Payments',
        value: c.paymentsDone ? 'Healthy' : 'Still to finish',
        ok: c.paymentsDone,
      },
    ];
  }
}
