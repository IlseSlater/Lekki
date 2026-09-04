import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudioContextService } from '../services/studio-context.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { LeosApiService } from '../services/leos-api.service';
import { getExperience, type ExperienceTypeId } from '../studio/experience-registry';
import {
  operateDoorsFor,
  stationDoors,
  type OperateDoor,
} from '../studio/operate-stations';
import { isTableIdlePulsing } from '../studio/operate-pressure';
import {
  nextOwnerHint,
  operateHandoffLine,
  placeGlanceLine,
  pressureSentence,
  rankEscalations,
  stationGlanceLine,
} from '../studio/operate-glance';
import { ServicePageComponent } from './service.page';
import { StationPageComponent } from './station.page';

type StationSummary = {
  id: string;
  label: string;
  preparing: number;
  attention: number;
  ready: number;
  monitorPath: string;
  line: string;
  tone: 'calm' | 'prep' | 'ready' | 'attention';
  pulse: boolean;
};

type EscalationRow = {
  id: string;
  sessionId: string;
  placeLabel: string;
  status: string;
  kind: string;
  createdAt?: string;
  ageLabel: string;
  pulse: boolean;
};

type TablePulse = {
  sessionId: string;
  placeCode: string;
  tone: 'calm' | 'prep' | 'ready' | 'attention';
  line: string;
  pulse: boolean;
  ageLabel: string;
};

/**
 * Studio Operate — Operations Overview (ADR-004).
 * Calm mission control · glance rows · Staff Experience monitors in the right rail.
 */
@Component({
  standalone: true,
  imports: [RouterLink, ServicePageComponent, StationPageComponent],
  template: `
    <div
      class="studio-operate studio-motion-appear"
      [class.studio-operate--panel]="panelOpen"
    >
      <div class="studio-operate__main">
        <header class="studio-operate__header">
          <p class="studio-operate__now">{{ greeting }}</p>
          <h1 class="studio-operate__venue">{{ venue }}</h1>
          @if (!live) {
            <p class="studio-operate__calm">Go live first — then oversight fills as guests arrive.</p>
          } @else if (loading) {
            <p class="studio-operate__calm">Checking the floor…</p>
          } @else {
            <p class="studio-operate__calm">{{ calmLine }}</p>
            <p class="studio-operate__handoff">{{ handoffLine }}</p>
            @if (ownerHint) {
              <p class="studio-operate__next">{{ ownerHint }}</p>
            }
          }
        </header>

        @if (actionMessage) {
          <p class="studio-operate__action-msg" role="status">{{ actionMessage }}</p>
        }
        @if (actionError) {
          <p class="studio-operate__action-err" role="alert">{{ actionError }}</p>
        }

        @if (live && escalations.length) {
          <section class="studio-operate__board" aria-label="Escalations">
            <p class="studio-operate__board-label">Needs you</p>
            @for (e of escalations; track e.id) {
              <div
                class="studio-operate__row studio-operate__row--escalation"
                [attr.data-tone]="'attention'"
                [class.studio-operate__row--pulse]="e.pulse"
              >
                <span class="studio-operate__place"
                  >{{ e.placeLabel }}
                  @if (e.ageLabel) {
                    <span class="studio-operate__age">{{ e.ageLabel }}</span>
                  }
                </span>
                <span class="studio-operate__status">{{
                  e.status === 'acknowledged' ? 'Claimed — on the way' : 'Waiting for claim'
                }}</span>
                <div class="studio-operate__hint studio-operate__hint--actions">
                  @if (e.status !== 'acknowledged') {
                    <button
                      type="button"
                      [class]="
                        isPrimaryClaim(e)
                          ? 'leos-btn leos-btn--primary studio-operate__claim'
                          : 'studio-operate__text-act'
                      "
                      [disabled]="busyId === e.id"
                      (click)="claim(e)"
                    >
                      Claim
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="studio-operate__text-act"
                      [disabled]="busyId === e.id"
                      (click)="resolveEscalation(e)"
                    >
                      Resolve
                    </button>
                  }
                  <button
                    type="button"
                    class="studio-operate__text-act"
                    [disabled]="busyId === e.id"
                    (click)="forceClear(e)"
                  >
                    Force clear
                  </button>
                  <button type="button" class="studio-operate__text-act" (click)="openFloorPanel()">
                    Floor ›
                  </button>
                </div>
              </div>
            }
          </section>
        }

        @if (live && showFloorBoard) {
          <section class="studio-operate__board" [attr.aria-label]="placeNoun + ' glance'">
            <div class="studio-operate__board-head">
              <p class="studio-operate__board-label">Floor</p>
              <button type="button" class="studio-operate__board-link" (click)="openFloorPanel()">
                Monitor ›
              </button>
            </div>
            @if (glancePlaces.length) {
              @for (t of glancePlaces; track t.sessionId) {
                <button
                  type="button"
                  class="studio-operate__row"
                  [attr.data-tone]="t.tone"
                  [class.studio-operate__row--pulse]="t.pulse"
                  [class.studio-operate__row--active]="panelOpen && panelKind === 'floor'"
                  (click)="openFloorPanel()"
                >
                  <span class="studio-operate__place"
                    >{{ placeNoun }} {{ t.placeCode }}
                    @if (t.ageLabel) {
                      <span class="studio-operate__age">{{ t.ageLabel }}</span>
                    }
                  </span>
                  <span class="studio-operate__status">{{ t.line }}</span>
                </button>
              }
            } @else {
              <button
                type="button"
                class="studio-operate__row"
                [attr.data-tone]="'calm'"
                (click)="openFloorPanel()"
              >
                <span class="studio-operate__place">{{ placeNounPlural }}</span>
                <span class="studio-operate__status">All calm</span>
              </button>
            }
          </section>
        }

        @if (live && summaries.length) {
          <section class="studio-operate__board" aria-label="Stations">
            <p class="studio-operate__board-label">Stations</p>
            @for (s of summaries; track s.id) {
              <button
                type="button"
                class="studio-operate__row"
                [attr.data-tone]="s.tone"
                [class.studio-operate__row--pulse]="s.pulse"
                [class.studio-operate__row--active]="
                  panelOpen && panelKind === 'station' && panelStationKey === s.id
                "
                (click)="openStationPanel(s)"
              >
                <span class="studio-operate__place">{{ s.label }}</span>
                <span class="studio-operate__status">{{ s.line }}</span>
              </button>
            }
          </section>
        }

        @if (!live) {
          <div class="studio-operate__doors">
            <a class="leos-btn leos-btn--primary" routerLink="/studio/setup/golive">Go live</a>
          </div>
        }

        @if (live) {
          <p class="studio-operate__foot">
            @if (guestCount != null) {
              <span>{{ guestCount }} {{ guestActivityLine }}</span>
            }
            @if (guestCount != null && paymentsLine) {
              <span class="studio-operate__foot-sep" aria-hidden="true">·</span>
            }
            @if (paymentsLine) {
              <span>Payments {{ paymentsLine.toLowerCase() }}</span>
            }
            @if (guestCount != null || paymentsLine) {
              <span class="studio-operate__foot-sep" aria-hidden="true">·</span>
            }
            <a class="studio-operate__foot-a" routerLink="/studio/team">Team</a>
            <span class="studio-operate__foot-sep" aria-hidden="true">·</span>
            <button type="button" class="studio-operate__foot-a" (click)="openFloorPanel()">
              Staff board
            </button>
            <span class="studio-operate__foot-sep" aria-hidden="true">·</span>
            <span class="studio-operate__foot-muted">{{ handoffLine }}</span>
          </p>
        }
      </div>

      <aside
        class="studio-operate__rail"
        [class.studio-operate__rail--open]="panelOpen"
        [attr.aria-hidden]="panelOpen ? null : 'true'"
      >
        @if (panelOpen) {
          <div class="studio-operate__rail-inner">
            <div class="studio-operate__rail-head">
              <p class="studio-operate__rail-label">{{ railLabel }}</p>
              <button
                type="button"
                class="studio-operate__rail-close"
                (click)="closeFloorPanel()"
                aria-label="Close staff board"
              >
                ×
              </button>
            </div>
            <div class="studio-operate__rail-board">
              @if (panelKind === 'floor') {
                <leos-service-board [embedMonitor]="true" />
              } @else if (panelStationKey) {
                <leos-station-board
                  [embedMonitor]="true"
                  [embedStationKey]="panelStationKey"
                />
              }
            </div>
          </div>
        }
      </aside>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .studio-operate {
        display: grid;
        grid-template-columns: minmax(0, 60%) minmax(0, 40%);
        align-items: start;
        gap: 0;
        max-width: none;
        padding: 0.25rem 0 2rem;
        transition: grid-template-columns var(--studio-duration-settle, 360ms)
          var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .studio-operate--panel {
        padding: 0;
      }
      .studio-operate__main {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--studio-pad-section, 2rem);
        padding-right: 1.25rem;
      }
      .studio-operate__rail {
        min-width: 0;
        width: 100%;
        opacity: 0;
        transform: translateX(1rem);
        pointer-events: none;
        transition:
          opacity var(--studio-duration, 220ms) var(--studio-ease-soft, cubic-bezier(0.33, 1, 0.68, 1)),
          transform var(--studio-duration-settle, 360ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .studio-operate__rail--open {
        position: sticky;
        top: var(--studio-pad-outer, 48px);
        height: calc(100dvh - (var(--studio-pad-outer, 48px) * 2));
        max-height: calc(100dvh - (var(--studio-pad-outer, 48px) * 2));
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }
      .studio-operate__rail-inner {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        height: 100%;
        max-height: 100%;
        padding: 1.1rem 1.25rem 1.25rem;
        border-radius: 1.5rem;
        background: #fff;
        border: 1px solid var(--studio-line, #eae6e1);
        box-shadow: 0 1px 2px rgba(27, 34, 48, 0.04);
        box-sizing: border-box;
        overflow: hidden;
        animation: operate-rail-rise var(--studio-duration-enter, 280ms)
          var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      @keyframes operate-rail-rise {
        from {
          opacity: 0;
          transform: translateY(0.4rem);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .studio-operate__rail-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .studio-operate__rail-label {
        margin: 0;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--studio-ink-tertiary, #94a3b8);
      }
      .studio-operate__rail-close {
        display: grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0.5rem;
        background: transparent;
        color: var(--studio-ink-secondary, #64748b);
        font: inherit;
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
      }
      .studio-operate__rail-close:hover {
        color: var(--studio-ink, #0f172a);
        background: rgba(15, 23, 42, 0.06);
      }
      .studio-operate__rail-board {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .studio-operate__rail-board > :is(leos-service-board, leos-station-board) {
        flex: 1;
        min-height: 0;
        height: 100%;
      }
      .studio-operate__handoff,
      .studio-operate__next {
        margin: 0.35rem 0 0;
        font-size: 0.875rem;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .studio-operate__next {
        font-weight: 650;
        color: var(--studio-ink, #1b2230);
      }
      .studio-operate__action-msg {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--studio-success, #4f8a6b);
      }
      .studio-operate__action-err {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #b45309;
      }
      .studio-operate__row {
        width: 100%;
        text-align: left;
        font: inherit;
        cursor: pointer;
        background: transparent;
        border: 0;
        border-bottom: 1px solid var(--studio-line, #eae6e1);
      }
      .studio-operate__row--active {
        background: color-mix(in srgb, var(--leos-gold, #d7a14a) 10%, transparent);
      }
      .studio-operate__board-link {
        border: 0;
        background: transparent;
        padding: 0;
        font: inherit;
        cursor: pointer;
      }
      .studio-operate__row--escalation {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
      }
      .studio-operate__hint--actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem 1rem;
        grid-column: 1 / -1;
        justify-content: flex-start;
        margin-top: 0.35rem;
      }
      .studio-operate__claim {
        min-height: 2.5rem;
        padding: 0.55rem 1.1rem;
        font-size: 0.875rem;
      }
      .studio-operate__text-act {
        border: none;
        background: transparent;
        padding: 0;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-ink-secondary, #6b7280);
        cursor: pointer;
        text-decoration: none;
      }
      .studio-operate__text-act:hover {
        color: var(--studio-ink, #1b2230);
      }
      .studio-operate__text-act:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .studio-operate__foot-a {
        border: 0;
        background: transparent;
        padding: 0;
        font: inherit;
        cursor: pointer;
      }
      @media (max-width: 900px) {
        .studio-operate,
        .studio-operate--panel {
          grid-template-columns: minmax(0, 100%);
        }
        .studio-operate__main {
          padding-right: 0;
        }
        .studio-operate__rail {
          position: fixed;
          inset: 0.75rem;
          z-index: 40;
          width: auto;
          transform: translateX(110%);
        }
        .studio-operate__rail--open {
          transform: translateX(0);
        }
        .studio-operate__rail-inner {
          max-height: none;
          height: 100%;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .studio-operate,
        .studio-operate__rail,
        .studio-operate__rail-inner {
          transition: none;
          animation: none;
        }
      }
    `,
  ],
})

export class SetupOperatePageComponent implements OnInit, OnDestroy {
  private readonly ctx = inject(StudioContextService);
  private readonly auth = inject(StudioAuthService);
  private readonly api = inject(LeosApiService);
  private poll?: ReturnType<typeof setInterval>;

  greeting = 'Good morning.';
  venue = 'Your experience';
  live = false;
  loading = true;
  calmLine = 'Everything is running smoothly.';
  summaries: StationSummary[] = [];
  escalations: EscalationRow[] = [];
  tablePulses: TablePulse[] = [];
  guestCount: number | null = null;
  paymentsLine = '';
  paymentsOk = true;
  helpCount = 0;
  floorMonitor = '';
  panelOpen = false;
  panelKind: 'floor' | 'station' = 'floor';
  panelStationKey = '';
  panelStationLabel = '';
  busyId: string | null = null;
  actionMessage = '';
  actionError = '';
  private doors: OperateDoor[] = [];
  private stations: OperateDoor[] = [];
  private typeId: ExperienceTypeId = 'restaurant';
  placeNoun = 'Table';
  placeNounPlural = 'Tables';
  guestActivityLine = 'currently dining';
  private placeBySession = new Map<string, string>();

  /** Hottest places first — calm rows stay off the glance. */
  get glancePlaces(): TablePulse[] {
    return this.tablePulses.filter((t) => t.tone !== 'calm').slice(0, 8);
  }

  get showFloorBoard(): boolean {
    return (this.guestCount ?? 0) > 0;
  }

  openFloorPanel() {
    this.panelKind = 'floor';
    this.panelStationKey = '';
    this.panelStationLabel = '';
    this.panelOpen = true;
  }

  openStationPanel(s: StationSummary) {
    this.panelKind = 'station';
    this.panelStationKey = s.id;
    this.panelStationLabel = s.label;
    this.panelOpen = true;
  }

  closeFloorPanel() {
    this.panelOpen = false;
  }

  get railLabel(): string {
    if (this.panelKind === 'station' && this.panelStationLabel) {
      return `${this.panelStationLabel} · monitoring`;
    }
    return 'Floor · monitoring';
  }

  /** Stations with work — calm stations collapse into one All calm row. */
  get glanceStations(): StationSummary[] {
    return this.summaries.filter((s) => s.tone !== 'calm');
  }

  /** One gold Claim — first open escalation only. */
  isPrimaryClaim(e: EscalationRow): boolean {
    const first = this.escalations.find((x) => x.status !== 'acknowledged');
    return !!first && first.id === e.id;
  }

  get handoffLine(): string {
    return operateHandoffLine();
  }

  get ownerHint(): string {
    const first = this.escalations.find((x) => x.status !== 'acknowledged');
    const hotStation = this.glanceStations[0];
    const hotPlace = this.glancePlaces[0];
    const placeLabel = hotPlace ? `${this.placeNoun} ${hotPlace.placeCode}` : null;
    return nextOwnerHint(first?.placeLabel ?? null, hotStation?.label ?? null, placeLabel);
  }

  ngOnInit() {
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

    this.venue = this.ctx.displayVenue();
    const cfg = this.ctx.readConfig();
    this.live = cfg.live;
    if (this.live) {
      // Match live Home — time-of-day only; first name stays on Welcome Back.
      this.greeting = base;
    }
    this.paymentsOk = !!cfg.paymentsDone;
    this.paymentsLine = this.paymentsOk ? 'Healthy' : 'Still to finish';
    this.typeId = (cfg.typeId || 'restaurant') as ExperienceTypeId;
    const def = getExperience(this.typeId);
    this.placeNoun = def?.terminology.place ?? 'Table';
    this.placeNounPlural = def?.defaults.placeLabel ?? `${this.placeNoun}s`;
    this.guestActivityLine =
      this.typeId === 'cafe' || this.typeId === 'festival' || this.typeId === 'airport'
        ? 'currently visiting'
        : this.typeId === 'hotel'
          ? 'in-house'
          : this.typeId === 'healthcare'
            ? 'in the bay'
            : 'currently dining';
    this.doors = operateDoorsFor(this.typeId);
    this.stations = stationDoors(this.typeId);
    const floor = this.doors.find((d) => d.role === 'floor');
    this.floorMonitor = floor?.monitorPath || '/staff/service?monitor=1';

    if (!this.live) {
      this.loading = false;
      return;
    }

    this.refresh();
    this.poll = setInterval(() => this.refresh(), 5000);
  }

  ngOnDestroy() {
    if (this.poll) clearInterval(this.poll);
  }

  claim(row: EscalationRow) {
    this.busyId = row.id;
    this.actionError = '';
    this.api.acknowledgeAssistance(row.id, { asOwner: true }).subscribe({
      next: () => {
        this.busyId = null;
        this.actionMessage = `${row.placeLabel} claimed — guest will see you’re on the way`;
        this.refresh();
      },
      error: () => {
        this.busyId = null;
        this.actionError = 'Couldn’t claim — try again';
      },
    });
  }

  resolveEscalation(row: EscalationRow) {
    this.busyId = row.id;
    this.actionError = '';
    this.api.resolveAssistance(row.id, { asOwner: true }).subscribe({
      next: () => {
        this.busyId = null;
        this.actionMessage = `${row.placeLabel} resolved`;
        this.refresh();
      },
      error: () => {
        this.busyId = null;
        this.actionError = 'Couldn’t resolve — try again';
      },
    });
  }

  forceClear(row: EscalationRow) {
    if (!row.sessionId) return;
    const ok = confirm(
      `Force clear ${row.placeLabel}? This ends the guest session. Staff monitors stay read-only.`,
    );
    if (!ok) return;
    this.busyId = row.id;
    this.actionError = '';
    this.api.closeSession(row.sessionId, { asOwner: true }).subscribe({
      next: () => {
        this.busyId = null;
        this.actionMessage = `${row.placeLabel} cleared`;
        this.api.resolveAssistance(row.id, { asOwner: true }).subscribe({ error: () => undefined });
        this.refresh();
      },
      error: () => {
        this.busyId = null;
        this.actionError = 'Couldn’t force clear — try again';
      },
    });
  }

  private ageLabel(createdAt?: string): string {
    if (!createdAt) return '';
    const mins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
    if (mins < 1) return 'Just now';
    return this.formatDuration(mins);
  }

  private idleAgeLabel(idleMinutes?: number): string {
    const mins = idleMinutes ?? 0;
    if (mins < 1) return '';
    return this.formatDuration(mins);
  }

  /** Under 60m → "12 min"; 60m+ → "1h 5 min". */
  private formatDuration(mins: number): string {
    if (mins < 60) return mins === 1 ? '1 min' : `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    if (rem === 0) return hours === 1 ? '1h' : `${hours}h`;
    return `${hours}h ${rem} min`;
  }

  private refresh() {
    const stationCalls = Object.fromEntries(
      this.stations.map((s) => [
        s.id,
        this.api.listFulfilments(s.apiId!).pipe(catchError(() => of([]))),
      ]),
    );

    forkJoin({
      ...stationCalls,
      assistance: this.api.listAssistance().pipe(catchError(() => of([]))),
      floor: this.api.listFloorTables().pipe(catchError(() => of({ tables: [] }))),
    }).subscribe((bundle) => {
      this.loading = false;
      const assistance = (
        bundle as {
          assistance: Array<{
            id: string;
            kind: string;
            status: string;
            sessionId?: string;
            createdAt?: string;
          }>;
        }
      ).assistance.filter((x) => x.status !== 'resolved');

      const floorBundle = bundle as {
        floor: {
          tables: Array<{
            sessionId: string;
            placeCode: string;
            idleMinutes?: number;
            readyCount?: number;
            preparingCount?: number;
            pendingCount?: number;
            helpCount?: number;
            helpKinds?: string[];
          }>;
        };
      };
      const floorTables = floorBundle.floor?.tables ?? [];
      this.placeBySession = new Map(floorTables.map((t) => [t.sessionId, t.placeCode]));
      this.guestCount = Array.isArray(floorTables) ? floorTables.length : null;

      const serviceHelp = assistance.filter((a) => a.kind !== 'manager');
      this.helpCount = serviceHelp.length;

      const managerSessions = new Set(
        assistance.filter((a) => a.kind === 'manager').map((a) => a.sessionId || ''),
      );

      this.escalations = rankEscalations(
        assistance
          .filter((a) => a.kind === 'manager')
          .map((a) => {
            const place = a.sessionId ? this.placeBySession.get(a.sessionId) : undefined;
            const ageLabel = this.ageLabel(a.createdAt);
            const mins = a.createdAt
              ? Math.max(0, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 60000))
              : 0;
            return {
              id: a.id,
              sessionId: a.sessionId || '',
              placeLabel: place ? `${this.placeNoun} ${place}` : `Guest ${this.placeNoun.toLowerCase()}`,
              status: a.status,
              kind: a.kind,
              createdAt: a.createdAt,
              ageLabel,
              pulse: a.status === 'open' || mins >= 2,
            };
          }),
      );

      this.tablePulses = floorTables
        .map((t) => {
          const help = t.helpCount ?? 0;
          const ready = t.readyCount ?? 0;
          const preparing = (t.preparingCount ?? 0) + (t.pendingCount ?? 0);
          const idle = t.idleMinutes ?? 0;
          const manager = managerSessions.has(t.sessionId);
          const prepWord =
            this.typeId === 'cafe' || this.typeId === 'festival' || this.typeId === 'airport'
              ? 'Making'
              : 'Preparing';
          let tone: TablePulse['tone'] = 'calm';
          if (manager || help > 0) {
            tone = 'attention';
          } else if (ready > 0) {
            tone = 'ready';
          } else if (preparing > 0) {
            tone = 'prep';
          }
          const line = placeGlanceLine(tone, prepWord);
          return {
            sessionId: t.sessionId,
            placeCode: t.placeCode,
            tone,
            line,
            pulse: tone === 'attention' || isTableIdlePulsing(idle),
            ageLabel: this.idleAgeLabel(idle),
          };
        })
        .sort((a, b) => {
          const rank = { attention: 0, ready: 1, prep: 2, calm: 3 };
          return rank[a.tone] - rank[b.tone] || a.placeCode.localeCompare(b.placeCode);
        });

      const next: StationSummary[] = [];
      let pressure = 0;

      for (const door of this.stations) {
        const list = (bundle as Record<string, unknown>)[door.id];
        const items = Array.isArray(list) ? list : [];
        let preparing = 0;
        let attention = 0;
        let ready = 0;
        for (const raw of items) {
          const f = raw as { status?: string };
          const st = (f.status || '').toLowerCase();
          if (st === 'ready') ready++;
          else if (st === 'pending' || st === 'queued') attention++;
          else if (st === 'preparing' || st === 'in_progress') preparing++;
        }
        pressure += attention * 2 + preparing + ready;
        const glance = stationGlanceLine(door.label, {
          waiting: attention,
          preparing,
          ready,
        });
        const line = glance.line;
        const tone = glance.tone;
        next.push({
          id: door.id,
          label: door.label,
          preparing,
          attention,
          ready,
          monitorPath: door.monitorPath,
          line,
          tone,
          pulse: attention > 0,
        });
      }
      this.summaries = next;

      const rising = pressureSentence(this.tablePulses, this.placeNoun);
      if (this.escalations.some((e) => e.status === 'open')) {
        this.calmLine = 'A guest is waiting for you.';
      } else if (rising) {
        this.calmLine = rising;
      } else if (this.helpCount > 0) {
        this.calmLine = 'The floor needs a quiet look.';
      } else if (pressure > 6) {
        this.calmLine = 'Busy — stations are moving.';
      } else if (this.guestCount === 0) {
        this.calmLine = 'Ready for the next guest.';
      } else {
        this.calmLine = 'Everything is running smoothly.';
      }
    });
  }
}
