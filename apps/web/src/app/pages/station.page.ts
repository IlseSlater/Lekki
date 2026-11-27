import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LeosApiService, type PlatformEventEnvelope } from '../services/leos-api.service';
import { StudioContextService } from '../services/studio-context.service';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import {
  floorRoleLabel,
  nextStationStatus,
  stationActionHint,
  stationCanAdvance,
  stationFlash,
  stationHandOffFlash,
  stationKindFromId,
  stationPrimaryCta,
  stationStatusLabel,
  type StationKind,
} from '../studio/operate-status';
import {
  ageLabel,
  ageMinutes,
  isPendingOverSla,
} from '../studio/operate-pressure';
import type { ExperienceTypeId } from '../studio/experience-registry';
import { staffPlaceLabel } from '../studio/place-continuity';
import { FormsModule } from '@angular/forms';
import {
  CANCEL_REASONS,
  DELAY_CHOICES,
  cancelReady,
  soldOutLabel,
  type CancelReason,
} from '../studio/order-actions';

type StationItem = {
  id: string;
  status: string;
  createdAt?: string;
  sessionId?: string;
  /** Session physical context — same code Guest sees. */
  placeCode?: string | null;
  transaction: { id: string };
  lines: Array<{ label?: string; quantity: number }>;
};

/**
 * Station queue — Kitchen / Bar board.
 * Three columns: New · Preparing · Ready (Restaurant App behaviour, LEOS craft).
 * One glance · one tap · one decision.
 */
@Component({
  standalone: true,
  selector: 'leos-station-board',
  imports: [RouterLink, FormsModule],
  host: {
    class: 'leos-layout-operator leos-layout-station-board',
    '[class.leos-station-board--embed]': 'embedMonitor',
  },
  template: `
    <div class="studio-operate studio-operate--board studio-motion-appear">
      <header class="studio-operate__header">
        @if (!embedMonitor) {
          <p class="studio-operate__now">{{ stationLabel }}@if (staffName) { · {{ staffName }}}</p>
          <h1 class="studio-operate__venue">{{ venue }}</h1>
        }
        @if (!activeCount && !loading) {
          <p class="studio-operate__calm">{{ emptyLine }}</p>
        } @else if (activeCount) {
          <p class="studio-operate__calm">
            {{ newItems.length }} new · {{ preparingItems.length }} preparing · {{ readyItems.length }} ready
          </p>
        }
      </header>

      @if (!monitorMode && !embedMonitor && (kind === 'kitchen' || kind === 'bar')) {
        <button type="button" class="station-86-open" (click)="openEightySix()">86 the board</button>
      }

      @if (error) {
        <p class="studio-operate__calm" role="alert">{{ error }}</p>
      }
      @if (message) {
        <p class="studio-operate__flash" role="status">{{ message }}</p>
      }

      @if (activeCount || loading) {
        <div class="studio-operate__columns" role="region" [attr.aria-label]="stationLabel + ' board'">
          <section class="studio-operate__column studio-operate__column--new" aria-label="New">
            <h2 class="studio-operate__col-title">
              New
              <span class="studio-operate__col-count">{{ newItems.length }}</span>
            </h2>
            @for (item of newItems; track item.id) {
              <button
                type="button"
                class="studio-operate__ticket"
                [class.studio-operate__ticket--pulse]="isSla(item)"
                [class.studio-operate__ticket--monitor]="monitorMode"
                [class.studio-operate__ticket--busy]="busy"
                [attr.data-tone]="tone(item.status)"
                [disabled]="busy || monitorMode"
                (click)="advanceItem(item)"
              >
                <span class="studio-operate__ticket-top">
                  <span class="studio-operate__place">{{ placeForPublic(item) }}</span>
                  <span class="studio-operate__age">{{ itemAge(item) }}</span>
                </span>
                <span class="studio-operate__ticket-lines">{{ linesLabel(item) }}</span>
                @if (!monitorMode) {
                  <span class="studio-operate__hint">{{ actionHint(item.status) }}</span>
                }
              </button>
              @if (!monitorMode || canManageOrders) {
                <button
                  type="button"
                  class="station-more"
                  [attr.aria-label]="'More for ' + placeForPublic(item)"
                  (click)="openTicket(item)"
                >
                  More
                </button>
              }
            } @empty {
              <p class="studio-operate__col-empty">Quiet</p>
            }
          </section>

          <section class="studio-operate__column studio-operate__column--prep" aria-label="Preparing">
            <h2 class="studio-operate__col-title">
              Preparing
              <span class="studio-operate__col-count">{{ preparingItems.length }}</span>
            </h2>
            @for (item of preparingItems; track item.id) {
              <button
                type="button"
                class="studio-operate__ticket"
                [class.studio-operate__ticket--monitor]="monitorMode"
                [class.studio-operate__ticket--busy]="busy"
                [attr.data-tone]="tone(item.status)"
                [disabled]="busy || monitorMode"
                (click)="advanceItem(item)"
              >
                <span class="studio-operate__ticket-top">
                  <span class="studio-operate__place">{{ placeForPublic(item) }}</span>
                  <span class="studio-operate__age">{{ itemAge(item) }}</span>
                </span>
                <span class="studio-operate__ticket-lines">{{ linesLabel(item) }}</span>
                @if (!monitorMode) {
                  <span class="studio-operate__hint">{{ actionHint(item.status) }}</span>
                }
              </button>
              @if (!monitorMode || canManageOrders) {
                <button
                  type="button"
                  class="station-more"
                  [attr.aria-label]="'More for ' + placeForPublic(item)"
                  (click)="openTicket(item)"
                >
                  More
                </button>
              }
            } @empty {
              <p class="studio-operate__col-empty">Quiet</p>
            }
          </section>

          <section class="studio-operate__column studio-operate__column--ready" aria-label="Ready">
            <h2 class="studio-operate__col-title">
              Ready
              <span class="studio-operate__col-count">{{ readyItems.length }}</span>
            </h2>
            @for (item of readyItems; track item.id) {
              <button
                type="button"
                class="studio-operate__ticket"
                [class.studio-operate__ticket--monitor]="monitorMode"
                [class.studio-operate__ticket--busy]="busy"
                [attr.data-tone]="tone(item.status)"
                [disabled]="busy || monitorMode"
                (click)="advanceItem(item)"
              >
                <span class="studio-operate__ticket-top">
                  <span class="studio-operate__place">{{ placeForPublic(item) }}</span>
                  <span class="studio-operate__age">{{ itemAge(item) }}</span>
                </span>
                <span class="studio-operate__ticket-lines">{{ linesLabel(item) }}</span>
                @if (!monitorMode) {
                  <span class="studio-operate__hint">{{ actionHint(item.status) }}</span>
                }
              </button>
              @if (!monitorMode || canManageOrders) {
                <button
                  type="button"
                  class="station-more"
                  [attr.aria-label]="'More for ' + placeForPublic(item)"
                  (click)="openTicket(item)"
                >
                  More
                </button>
              }
            } @empty {
              <p class="studio-operate__col-empty">Quiet</p>
            }
          </section>
        </div>
      }

      @if (!embedMonitor) {
        <p class="studio-operate__foot">
          @if (monitorMode) {
            <a class="studio-operate__foot-a" routerLink="/studio/operate">Overview</a>
          } @else if (inStaffShell) {
            <a class="studio-operate__foot-a" routerLink="/staff">Switch</a>
            @if (staffSession.canAccessRole('waiter')) {
              <span class="studio-operate__foot-sep" aria-hidden="true">·</span>
              <a class="studio-operate__foot-a" [routerLink]="servicePath">{{ runnerLabel }}</a>
            }
          } @else {
            <a class="studio-operate__foot-a" routerLink="/studio/operate">Overview</a>
          }
        </p>
      }

      @if (!monitorMode) {
        <div class="studio-operate__doors">
          <button
            type="button"
            class="leos-btn leos-btn--primary"
            [disabled]="busy || !primaryTicket"
            (click)="advancePrimary()"
          >
            {{ primaryCta }}
          </button>
        </div>
      } @else if (!embedMonitor) {
        <p class="studio-operate__calm">Monitoring — actions happen in Staff Experience.</p>
      }

      @if (ticket) {
        <div class="station-86" role="dialog" aria-modal="true" aria-labelledby="ticket-title">
          <div class="station-86__card">
            <h2 id="ticket-title" class="station-86__title">{{ placeForPublic(ticket) }}</h2>
            <p class="station-86__lead">{{ linesLabel(ticket) }}</p>

            <h3 class="station-sheet__h">Need more time?</h3>
            @if (ticketDelayed) {
              <p class="station-86__lead">Already pushed back once. Talk to the table if it needs longer.</p>
            } @else {
              <div class="station-sheet__chips">
                @for (m of delayChoices; track m) {
                  <button type="button" class="station-86__btn" [disabled]="ticketBusy" (click)="delayTicket(m)">
                    +{{ m }} min
                  </button>
                }
              </div>
            }

            <h3 class="station-sheet__h">Cancel this order</h3>
            <div class="station-sheet__chips" role="radiogroup" aria-label="Why cancel">
              @for (r of cancelReasons; track r) {
                <button
                  type="button"
                  role="radio"
                  class="station-86__btn"
                  [class.station-86__btn--on]="cancelReason === r"
                  [attr.aria-checked]="cancelReason === r"
                  (click)="cancelReason = r"
                >
                  {{ r }}
                </button>
              }
            </div>
            @if (cancelReason) {
              <label class="station-sheet__note">
                <span>{{ cancelReason === 'Other' ? 'What happened? (needed)' : 'Anything to add? (optional)' }}</span>
                <input class="leos-field__input" [(ngModel)]="cancelNote" maxlength="140" />
              </label>
              <button
                type="button"
                class="leos-btn leos-btn--secondary station-sheet__cancel"
                [disabled]="ticketBusy || !canCancel"
                (click)="cancelTicket()"
              >
                Cancel the order
              </button>
            }

            <h3 class="station-sheet__h">What happened so far</h3>
            @if (timeline.length) {
              <ol class="station-sheet__timeline">
                @for (s of timeline; track s.at + s.step) {
                  <li>
                    <span class="station-sheet__time">{{ clock(s.at) }}</span>
                    <span>{{ s.step }}@if (s.by) { · {{ s.by }} }@if (s.detail) { · {{ s.detail }} }</span>
                  </li>
                }
              </ol>
            } @else {
              <p class="station-86__lead">{{ ticketBusy ? 'Loading…' : 'Nothing logged yet.' }}</p>
            }
            @if (ticketError) {
              <p class="studio-operate__calm" role="alert">{{ ticketError }}</p>
            }
            <button type="button" class="leos-btn leos-btn--secondary" (click)="closeTicket()">Done</button>
          </div>
        </div>
      }

      @if (eightySixOpen) {
        <div class="station-86" role="dialog" aria-modal="true" aria-labelledby="station-86-title">
          <div class="station-86__card">
            <h2 id="station-86-title" class="station-86__title">What's off?</h2>
            <p class="station-86__lead">One tap. Guests stop seeing it.</p>
            @if (boardBusy && !boardItems.length) {
              <p class="station-86__lead">Checking the board…</p>
            } @else if (!boardItems.length) {
              <p class="station-86__lead">Nothing to 86 yet — the pack menu is still empty.</p>
            } @else {
              <ul class="station-86__list">
                @for (item of boardItems; track item.id) {
                  <li class="station-86__item" [class.station-86__row--off]="!item.available">
                    <span class="station-86__name">
                      {{ item.label }}
                      @if (!item.available) {
                        <span class="station-86__when">{{ soldOutLabel(item) }}</span>
                      }
                    </span>
                    <span class="station-86__acts">
                      @if (item.available) {
                        <button type="button" class="station-86__btn" [disabled]="boardBusy" (click)="setSoldOut(item, 'today')">
                          Off today
                        </button>
                        <button type="button" class="station-86__btn" [disabled]="boardBusy" (click)="setSoldOut(item, 'until_changed')">
                          Until I change it
                        </button>
                      } @else {
                        <button type="button" class="station-86__btn" [disabled]="boardBusy" (click)="setSoldOut(item, 'back')">
                          Back on
                        </button>
                      }
                    </span>
                  </li>
                }
              </ul>
            }
            <button type="button" class="leos-btn leos-btn--secondary" (click)="closeEightySix()">Done</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        --col-new: #ffe8dc;
        --col-new-ink: #8f3a26;
        --col-new-accent: #e86b4a;
        --col-prep: #e7f0ff;
        --col-prep-ink: #2a4f8f;
        --col-prep-accent: #4a7fd4;
        --col-ready: #e4f6ea;
        --col-ready-ink: #1f6b45;
        --col-ready-accent: #3d9a68;
      }
      :host.leos-station-board--embed {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }
      :host.leos-station-board--embed .studio-operate--board {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        height: 100%;
        gap: 0.45rem;
      }
      :host.leos-station-board--embed .studio-operate__header {
        flex-shrink: 0;
      }
      :host.leos-station-board--embed .studio-operate__header .studio-operate__calm {
        margin: 0;
        font-size: 0.82rem;
      }
      :host.leos-station-board--embed .studio-operate__columns {
        grid-template-columns: 1fr;
        grid-template-rows: repeat(3, minmax(0, 1fr));
        flex: 1;
        min-height: 0;
        margin-top: 0;
        gap: 0.5rem;
        overflow: hidden;
      }
      :host.leos-station-board--embed .studio-operate__column {
        min-height: 0;
        padding: 0.55rem 0.65rem;
        gap: 0.4rem;
        overflow: auto;
        scrollbar-width: thin;
      }
      :host.leos-station-board--embed .studio-operate__col-title {
        font-size: 0.85rem;
      }
      :host.leos-station-board--embed .studio-operate__col-count {
        min-width: 1.35rem;
        height: 1.35rem;
        font-size: 0.7rem;
      }
      :host.leos-station-board--embed .studio-operate__col-empty {
        margin: 0.15rem 0 0;
        font-size: 0.8rem;
      }
      :host.leos-station-board--embed .studio-operate__ticket {
        padding: 0.65rem 0.75rem;
        gap: 0.2rem;
      }
      :host.leos-station-board--embed .studio-operate__ticket .studio-operate__place {
        font-size: 0.95rem;
      }
      :host.leos-station-board--embed .studio-operate__ticket-lines {
        font-size: 0.82rem;
      }
      .studio-operate--board {
        max-width: none;
      }
      .studio-operate__columns {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        margin-top: 1.1rem;
        align-items: stretch;
      }
      @media (max-width: 860px) {
        .studio-operate__columns {
          grid-template-columns: 1fr;
        }
      }
      .studio-operate__column {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        min-height: 12rem;
        padding: 0.85rem;
        border-radius: 1.15rem;
        border: 0;
        position: relative;
        overflow: hidden;
      }
      .studio-operate__column--new {
        background: var(--col-new);
        color: var(--col-new-ink);
      }
      .studio-operate__column--prep {
        background: var(--col-prep);
        color: var(--col-prep-ink);
      }
      .studio-operate__column--ready {
        background: var(--col-ready);
        color: var(--col-ready-ink);
      }
      .studio-operate__col-title {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        font-size: 0.95rem;
        font-weight: 750;
        letter-spacing: -0.02em;
        text-transform: none;
        color: inherit;
        z-index: 1;
      }
      .studio-operate__col-count {
        min-width: 1.5rem;
        height: 1.5rem;
        padding: 0 0.45rem;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 750;
        letter-spacing: 0;
        color: #fff;
      }
      .studio-operate__column--new .studio-operate__col-count {
        background: var(--col-new-accent);
      }
      .studio-operate__column--prep .studio-operate__col-count {
        background: var(--col-prep-accent);
      }
      .studio-operate__column--ready .studio-operate__col-count {
        background: var(--col-ready-accent);
      }
      .studio-operate__col-empty {
        margin: 0.5rem 0 0;
        font-size: 0.875rem;
        font-weight: 600;
        opacity: 0.55;
        z-index: 1;
      }
      .studio-operate__ticket {
        display: grid;
        gap: 0.3rem;
        width: 100%;
        text-align: left;
        padding: 0.9rem 0.95rem;
        border-radius: 0.9rem;
        border: 0;
        background: #fff;
        font: inherit;
        color: #1b2230;
        cursor: pointer;
        box-shadow: 0 1px 0 rgba(27, 34, 48, 0.04);
        z-index: 1;
        transition:
          transform 150ms ease,
          box-shadow 180ms ease;
      }
      .studio-operate__ticket:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 18px rgba(27, 34, 48, 0.08);
      }
      .studio-operate__ticket:disabled {
        opacity: 0.55;
        cursor: default;
      }
      .studio-operate__ticket--monitor:disabled {
        opacity: 1;
        cursor: default;
      }
      .studio-operate__ticket--busy:disabled {
        opacity: 0.55;
        cursor: wait;
      }
      .studio-operate__ticket--pulse {
        animation: studio-operate-pulse 2s ease-in-out infinite;
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--col-new-accent) 45%, transparent);
      }
      .studio-operate__ticket--monitor.studio-operate__ticket--pulse {
        animation: none;
        box-shadow: 0 1px 0 rgba(27, 34, 48, 0.04);
      }
      .studio-operate__ticket-top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5rem;
        width: 100%;
      }
      .studio-operate__ticket .studio-operate__place {
        font-size: 1.05rem;
        font-weight: 750;
        letter-spacing: -0.02em;
        color: #1b2230;
        min-width: 0;
        flex: 1 1 auto;
      }
      .studio-operate__ticket .studio-operate__age {
        margin: 0 0 0 auto;
        font-size: 0.75rem;
        font-weight: 700;
        color: #6b7280;
        flex: 0 0 auto;
        white-space: nowrap;
        text-align: right;
      }
      .studio-operate__ticket-lines {
        font-size: 0.9rem;
        font-weight: 600;
        color: #3a4250;
        line-height: 1.35;
      }
      .studio-operate__ticket .studio-operate__hint {
        margin-top: 0.15rem;
        font-size: 0.78rem;
        font-weight: 750;
        letter-spacing: 0.01em;
      }
      .studio-operate__column--new .studio-operate__hint {
        color: var(--col-new-accent);
      }
      .studio-operate__column--prep .studio-operate__hint {
        color: var(--col-prep-accent);
      }
      .studio-operate__column--ready .studio-operate__hint {
        color: var(--col-ready-accent);
      }
      .studio-operate__flash {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--studio-success, #4f8a6b);
      }
      .station-86-open {
        margin: 0.35rem 0 0;
        padding: 0;
        border: 0;
        background: none;
        color: #5c6573;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 0.18em;
      }
      .station-86 {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        padding: 1.25rem;
        background: rgba(27, 34, 48, 0.28);
      }
      .station-86__card {
        width: min(100%, 26rem);
        max-height: min(80dvh, 36rem);
        overflow: auto;
        padding: 1.35rem 1.35rem 1.25rem;
        border-radius: 1.5rem;
        background: #fff;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
      }
      .station-86__title {
        margin: 0;
        font-family: Fraunces, Georgia, serif;
        font-size: 1.35rem;
        font-weight: 650;
        color: #1b2230;
      }
      .station-86__lead {
        margin: 0.35rem 0 1rem;
        font-size: 0.875rem;
        color: #5c6573;
      }
      .station-86__list {
        list-style: none;
        margin: 0 0 1rem;
        padding: 0;
      }
      .station-86__row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        width: 100%;
        margin: 0;
        padding: 0.85rem 0;
        border: 0;
        border-bottom: 1px solid #eae6e1;
        background: none;
        font: inherit;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #1b2230;
        cursor: pointer;
        text-align: left;
      }
      .station-86__row--off .station-86__name {
        color: #64748b;
      }
      .station-86__item {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid #eae6e1;
      }
      .station-86__name {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        font-weight: 600;
        color: #1b2230;
      }
      .station-86__when {
        font-size: 0.8rem;
        font-weight: 500;
        color: #475569;
      }
      .station-86__acts,
      .station-sheet__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .station-86__btn {
        min-height: 2.75rem;
        padding: 0 0.85rem;
        border: 1px solid #d8d2c9;
        border-radius: 999px;
        background: #ffffff;
        color: #1b2230;
        font: inherit;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
      }
      .station-86__btn--on {
        background: #1b2230;
        border-color: #1b2230;
        color: #ffffff;
      }
      .station-86__btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .station-more {
        align-self: flex-end;
        min-height: 2.75rem;
        margin: -0.25rem 0 0.5rem;
        padding: 0 0.85rem;
        border: 0;
        background: none;
        color: #475569;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 3px;
        cursor: pointer;
      }
      .station-sheet__h {
        margin: 1.1rem 0 0.5rem;
        font-size: 0.9rem;
        font-weight: 650;
        color: #1b2230;
      }
      .station-sheet__note {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-top: 0.6rem;
        font-size: 0.85rem;
        color: #475569;
      }
      .station-sheet__cancel {
        margin-top: 0.6rem;
      }
      .station-sheet__timeline {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: #1b2230;
      }
      .station-sheet__timeline li {
        display: flex;
        gap: 0.6rem;
      }
      .station-sheet__time {
        flex-shrink: 0;
        width: 3rem;
        color: #475569;
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
})
export class StationPageComponent implements OnInit, OnChanges, OnDestroy {
  private readonly api = inject(LeosApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ctx = inject(StudioContextService);
  readonly staffSession = inject(OperateStaffSessionService);

  /** Studio Operate right rail — read-only station queue. */
  @Input() embedMonitor = false;
  /** Route key: kitchen | bar | counter | … */
  @Input() embedStationKey = '';

  stationId = '';
  stationLabel = '';
  venue = 'Your experience';
  staffName = '';
  items: StationItem[] = [];
  error = '';
  busy = false;
  message = '';
  loading = true;
  kind: StationKind = 'generic';
  runnerLabel = 'Waiter';
  monitorMode = false;
  inStaffShell = false;
  servicePath = '/staff/service';
  private placeNoun = 'Table';
  private poll?: ReturnType<typeof setInterval>;
  private ageTick?: ReturnType<typeof setInterval>;
  private unsubPlatform?: () => void;
  private organisationId = '';
  private operateRole = 'kitchen';
  /** Bumps so age labels refresh without a network round-trip */
  nowMs = Date.now();
  eightySixOpen = false;
  boardBusy = false;
  boardItems: Array<{ id: string; label: string; available: boolean; soldOutUntil?: string | null }> = [];
  private venueId = '';

  private readonly stationAliases: Record<
    string,
    { id: string; label: string; place?: string; role?: string }
  > = {
    kitchen: { id: 'station-kitchen', label: 'Kitchen', place: 'Table', role: 'kitchen' },
    bar: { id: 'station-bar', label: 'Bar', place: 'Table', role: 'bar' },
    counter: { id: 'station-counter', label: 'Counter', place: 'Pickup', role: 'counter' },
    'room-service': { id: 'station-room-service', label: 'Room service', place: 'Room' },
    housekeeping: { id: 'station-housekeeping', label: 'Housekeeping', place: 'Room' },
    reception: { id: 'station-reception', label: 'Reception', place: 'Desk' },
    'food-truck': { id: 'station-food-truck', label: 'Food truck', place: 'Order' },
    'fest-bar': { id: 'station-fest-bar', label: 'Festival bar', place: 'Order' },
    merch: { id: 'station-merch', label: 'Merch', place: 'Order' },
    'gate-cafe': { id: 'station-gate-cafe', label: 'Gate café', place: 'Gate' },
    'lounge-bar': { id: 'station-lounge-bar', label: 'Lounge bar', place: 'Seat' },
    'gate-service': { id: 'station-gate-service', label: 'Gate service', place: 'Gate' },
    'clinic-cafe': { id: 'station-clinic-cafe', label: 'Clinic café', place: 'Counter' },
    'clinic-pharmacy': { id: 'station-clinic-pharmacy', label: 'Pharmacy counter', place: 'Counter' },
    'clinic-reception': { id: 'station-clinic-reception', label: 'Reception', place: 'Desk' },
  };

  get newItems() {
    return this.items.filter((i) => i.status === 'pending' || i.status === 'created');
  }

  get preparingItems() {
    return this.items.filter((i) => i.status === 'preparing');
  }

  get readyItems() {
    return this.items.filter((i) => i.status === 'ready');
  }

  get activeCount() {
    return this.newItems.length + this.preparingItems.length + this.readyItems.length;
  }

  get orderedItems(): StationItem[] {
    return [...this.newItems, ...this.preparingItems, ...this.readyItems];
  }

  /** Next ticket this station can advance (kitchen/bar skip Ready). */
  get primaryTicket(): StationItem | null {
    const actionable = this.orderedItems.filter((i) => stationCanAdvance(i.status, this.kind));
    return actionable[0] ?? null;
  }

  get primaryCta(): string {
    return stationPrimaryCta(this.primaryTicket?.status ?? null, this.kind);
  }

  get emptyLine() {
    return `${this.stationLabel} is quiet — you’re ready when guests arrive.`;
  }

  ngOnInit() {
    this.venue = this.ctx.displayVenue();
    this.inStaffShell = this.router.url.includes('/staff');
    const cfg = this.ctx.readConfig();
    const typeId = (cfg.typeId || 'restaurant') as ExperienceTypeId;
    const floorKind =
      typeId === 'cafe' || typeId === 'airport' || typeId === 'festival' ? 'cafe' : 'restaurant';
    this.runnerLabel = floorRoleLabel(floorKind);
    const who = this.staffSession.read();
    this.staffName = who?.displayName?.split('·')[0]?.trim() || who?.displayName || '';

    if (this.embedMonitor && this.embedStationKey) {
      this.monitorMode = true;
      this.applyStationKey(this.embedStationKey);
      return;
    }

    this.monitorMode = this.router.url.includes('monitor=1');
    this.route.paramMap.subscribe((params) => {
      this.inStaffShell = this.router.url.includes('/staff');
      this.monitorMode = this.embedMonitor || this.router.url.includes('monitor=1');
      this.applyStationKey(params.get('stationId') ?? '');
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.embedMonitor) return;
    if (changes['embedStationKey'] && this.embedStationKey) {
      this.monitorMode = true;
      this.applyStationKey(this.embedStationKey);
    }
  }

  private applyStationKey(raw: string) {
    const mapped = this.stationAliases[raw];
    if (mapped) {
      this.stationId = mapped.id;
      this.stationLabel = mapped.label;
      this.placeNoun = mapped.place ?? 'Table';
    } else if (raw.startsWith('station-')) {
      this.stationId = raw;
      this.stationLabel = raw.replace(/^station-/, '').replace(/-/g, ' ') || 'Station';
    } else {
      this.stationId = raw ? `station-${raw}` : '';
      this.stationLabel = raw.replace(/-/g, ' ') || 'Station';
    }
    this.kind = stationKindFromId(this.stationId);
    this.operateRole =
      this.kind === 'bar'
        ? 'bar'
        : this.kind === 'counter'
          ? 'counter'
          : this.kind === 'kitchen'
            ? 'kitchen'
            : 'staff';

    const staff = this.staffSession.read();
    if (!this.staffSession.isSignedIn() && !this.monitorMode) {
      void this.router.navigate(['/staff'], {
        queryParams: { next: this.router.url.split('?')[0] },
      });
      return;
    }
    if (staff && !this.monitorMode) {
      const needed = mapped?.role;
      if (needed && staff.role !== 'staff' && staff.role !== needed) {
        void this.router.navigateByUrl(staff.homePath);
        return;
      }
    }
    if (staff) {
      this.organisationId = staff.organisationId;
      this.staffName = staff.displayName?.split('·')[0]?.trim() || staff.displayName || '';
    }
    this.venueId = this.ctx.activeExperience()?.venueId?.trim() || '';

    this.bindOperateSocket();
    this.refresh();
    this.startPoll();
    if (!this.ageTick) {
      this.ageTick = setInterval(() => (this.nowMs = Date.now()), 30000);
    }
  }

  ngOnDestroy() {
    if (this.poll) clearInterval(this.poll);
    if (this.ageTick) clearInterval(this.ageTick);
    this.unsubPlatform?.();
  }

  private bindOperateSocket() {
    this.unsubPlatform?.();
    if (!this.organisationId) return;
    this.api.ensureOperateSocket(this.organisationId, this.operateRole);
    this.unsubPlatform = this.api.onPlatformEvent((envelope) => this.onOperateEvent(envelope));
  }

  private onOperateEvent(envelope: PlatformEventEnvelope) {
    const name = envelope?.eventName ?? '';
    const refreshOn = new Set([
      'FulfilmentCreated',
      'FulfilmentStatusChanged',
      'TransactionCreated',
    ]);
    if (!refreshOn.has(name)) return;
    const stationId = envelope?.payload?.['stationId'] as string | undefined;
    if (
      stationId &&
      this.stationId &&
      (name === 'FulfilmentCreated' || name === 'FulfilmentStatusChanged') &&
      stationId !== this.stationId
    ) {
      return;
    }
    this.refresh(true);
  }

  private startPoll() {
    if (this.poll) clearInterval(this.poll);
    this.poll = setInterval(
      () => this.refresh(true),
      this.api.isSocketConnected() ? 8000 : 4000,
    );
  }

  tone(status: string): 'prep' | 'ready' | 'attention' | 'new' {
    if (status === 'ready') return 'ready';
    if (status === 'preparing') return 'prep';
    return 'new';
  }

  statusLabel(status: string): string {
    return stationStatusLabel(status, this.kind);
  }

  actionHint(status: string): string {
    return stationActionHint(status, this.kind);
  }

  itemAge(item: StationItem): string {
    return ageLabel(ageMinutes(item.createdAt, this.nowMs));
  }

  isSla(item: StationItem): boolean {
    return isPendingOverSla(item.status, item.createdAt, this.nowMs);
  }

  openEightySix() {
    this.eightySixOpen = true;
    if (!this.venueId) {
      this.api.getGrowOverview().subscribe({
        next: (overview) => {
          if (overview.venueId) {
            this.venueId = overview.venueId;
            this.loadBoard();
          }
        },
        error: () => undefined,
      });
      return;
    }
    this.loadBoard();
  }

  closeEightySix() {
    this.eightySixOpen = false;
  }

  readonly soldOutLabel = soldOutLabel;

  /** Off for today (back tomorrow by itself), until changed, or back on now. */
  setSoldOut(item: { id: string }, mode: 'today' | 'until_changed' | 'back') {
    this.boardBusy = true;
    this.api.setItemAvailability(item.id, mode).subscribe({
      next: () => this.loadBoard(),
      error: () => {
        this.boardBusy = false;
      },
    });
  }

  // --- One order: delay once, cancel with a reason, see its steps ---
  readonly delayChoices = DELAY_CHOICES;
  readonly cancelReasons = CANCEL_REASONS;
  ticket: StationItem | null = null;
  ticketBusy = false;
  ticketError = '';
  ticketDelayed = false;
  cancelReason: CancelReason | '' = '';
  cancelNote = '';
  timeline: Array<{ at: string; step: string; by: string | null; detail: string | null }> = [];

  /**
   * Managers open any order — even on Studio's read-only board — to see its steps,
   * push it back or cancel it. Moving it along stays with the station.
   */
  get canManageOrders(): boolean {
    return !!this.staffSession.read()?.permissions?.includes('organisation.manage');
  }

  get canCancel(): boolean {
    return cancelReady(this.cancelReason, this.cancelNote);
  }

  openTicket(item: StationItem) {
    this.ticket = item;
    this.cancelReason = '';
    this.cancelNote = '';
    this.ticketError = '';
    this.timeline = [];
    this.loadTimeline();
  }

  closeTicket() {
    this.ticket = null;
  }

  clock(iso: string): string {
    const t = Date.parse(iso);
    return Number.isFinite(t)
      ? new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '';
  }

  delayTicket(minutes: number) {
    if (!this.ticket) return;
    this.ticketBusy = true;
    this.ticketError = '';
    this.api.delayFulfilment(this.ticket.id, minutes).subscribe({
      next: () => {
        this.ticketBusy = false;
        this.message = `Pushed back ${minutes} min — the table can see it.`;
        setTimeout(() => (this.message = ''), 2200);
        this.loadTimeline();
      },
      error: (err: { error?: { message?: string } }) => {
        this.ticketBusy = false;
        this.ticketError = err?.error?.message || 'Could not delay this order.';
        this.loadTimeline();
      },
    });
  }

  cancelTicket() {
    if (!this.ticket || !this.canCancel || !this.cancelReason) return;
    this.ticketBusy = true;
    this.ticketError = '';
    this.api.cancelFulfilment(this.ticket.id, this.cancelReason, this.cancelNote).subscribe({
      next: () => {
        this.ticketBusy = false;
        this.ticket = null;
        this.message = 'Order cancelled. Managers have been told why.';
        setTimeout(() => (this.message = ''), 2400);
        this.refresh();
      },
      error: (err: { error?: { message?: string } }) => {
        this.ticketBusy = false;
        this.ticketError = err?.error?.message || 'Could not cancel this order.';
      },
    });
  }

  private loadTimeline() {
    if (!this.ticket) return;
    this.ticketBusy = true;
    const id = this.ticket.id;
    this.api.fulfilmentTimeline(id).subscribe({
      next: (steps) => {
        if (this.ticket?.id !== id) return;
        this.timeline = steps;
        this.ticketDelayed = steps.some((s) => s.step.startsWith('Delayed'));
        this.ticketBusy = false;
      },
      error: () => {
        this.ticketBusy = false;
      },
    });
  }

  private loadBoard() {
    if (!this.venueId) return;
    this.boardBusy = true;
    this.api.getCatalogue(this.venueId).subscribe({
      next: (items) => {
        this.boardItems = items.map((i) => ({
          id: i.id,
          label: i.label,
          available: i.available !== false,
          soldOutUntil: i.soldOutUntil ?? null,
        }));
        this.boardBusy = false;
      },
      error: () => {
        this.boardBusy = false;
      },
    });
  }

  placeLabel(item: StationItem): string {
    const lines = this.linesLabel(item);
    const place = this.placeForPublic(item);
    return lines ? `${place} · ${lines}` : place;
  }

  placeForPublic(item: StationItem): string {
    return this.placeFor(item);
  }

  linesLabel(item: StationItem): string {
    if (!item.lines?.length) return 'Order';
    const parts = item.lines.map((l) => `${l.quantity}× ${l.label ?? 'item'}`);
    return parts.join(', ');
  }

  private placeFor(item: StationItem): string {
    return staffPlaceLabel(this.placeNoun, item.placeCode);
  }

  refresh(silent = false) {
    if (!this.stationId) return;
    this.api.listFulfilments(this.stationId).subscribe({
      next: (items) => {
        this.loading = false;
        this.error = '';
        this.items = items as StationItem[];
      },
      error: () => {
        this.loading = false;
        if (!silent) this.error = 'Couldn’t load the queue — try again shortly.';
      },
    });
  }

  advancePrimary() {
    const item = this.primaryTicket;
    if (item) this.advanceItem(item);
  }

  advanceItem(item: StationItem) {
    if (this.monitorMode) return;
    if (!stationCanAdvance(item.status, this.kind)) {
      this.message = stationHandOffFlash(this.kind);
      setTimeout(() => (this.message = ''), 2200);
      void this.router.navigate(['/staff', 'service'], { queryParams: { tab: 'ready' } });
      return;
    }
    const next = nextStationStatus(item.status, this.kind);
    if (next) this.setStatus(item.id, next);
  }

  setStatus(id: string, status: string) {
    this.busy = true;
    this.error = '';
    this.message = '';
    this.api.updateFulfilmentStatus(id, status).subscribe({
      next: () => {
        this.busy = false;
        this.message = stationFlash(status, this.kind);
        setTimeout(() => (this.message = ''), 1800);
        this.refresh();
      },
      error: (err: { status?: number }) => {
        this.busy = false;
        if (err?.status === 401) {
          this.staffSession.clear();
          this.error = 'Session ended — enter your PIN again.';
          void this.router.navigate(['/staff'], {
            queryParams: { next: this.router.url.split('?')[0] },
          });
          return;
        }
        if (err?.status === 403) {
          this.error = 'This Experience can’t update that ticket.';
          return;
        }
        this.error = 'Couldn’t update — try again.';
      },
    });
  }
}
