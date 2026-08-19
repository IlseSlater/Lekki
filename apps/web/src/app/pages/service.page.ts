import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LeosApiService, SessionStateService, type PlatformEventEnvelope } from '../services/leos-api.service';
import { TerminologyService } from '../services/terminology.service';
import { StudioContextService } from '../services/studio-context.service';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { stationDoors, type OperateDoor } from '../studio/operate-stations';
import type { ExperienceTypeId } from '../studio/experience-registry';
import { getExperience } from '../studio/experience-registry';
import {
  floorRoleLabel,
  floorServeCta,
  floorServeFlash,
  floorServeHint,
  guestServiceAssistCopy,
  guestManagerAssistCopy,
  guestStatusLabel,
} from '../studio/operate-status';
import { isTableIdlePulsing } from '../studio/operate-pressure';

type FloorTab = 'tables' | 'ready' | 'help';
type DetailItemsTab = 'active' | 'history';
type StickyTint = 'help' | 'ready' | 'clear';

type ReadyRow = {
  id: string;
  place: string;
  label: string;
  stationPath: string;
  fulfilmentId: string;
  sessionId?: string;
};

type ReadyLine = {
  fulfilmentId: string;
  label: string;
  stationId: string;
  status: string;
  quantity: number;
};

type ReadyGroup = {
  key: string;
  place: string;
  sessionId?: string;
  readyCount: number;
  lines: ReadyLine[];
  idleMinutes?: number;
  flash: boolean;
};

type TableRow = {
  sessionId: string;
  placeCode: string;
  idleMinutes: number;
  orderCount: number;
  fulfilmentCount: number;
  readyCount: number;
  preparingCount?: number;
  pendingCount?: number;
  helpCount: number;
  items?: Array<{
    fulfilmentId: string;
    status: string;
    stationId: string;
    label: string;
    quantity: number;
  }>;
};

type TableItem = {
  fulfilmentId: string;
  label: string;
  status: string;
  stationId: string;
};

type HelpReq = {
  id: string;
  kind: string;
  message?: string;
  sessionId?: string;
  status?: string;
  createdAt?: string;
};

/**
 * Waiter floor — Mobbin task-card board.
 * Tables · Ready (grouped) · Help · sticky one-job CTA.
 */
@Component({
  standalone: true,
  imports: [RouterLink],
  host: { class: 'leos-layout-operator leos-layout-waiter-board' },
  template: `
    <div
      class="waiter"
      [class.waiter--detail]="!!detail"
      [attr.data-live]="socketLive ? 'true' : null"
    >
      <header class="waiter__header">
        <div class="waiter__title-row">
          <p class="waiter__eyebrow">
            {{ roleLabel }}
            @if (staffName) {
              <span aria-hidden="true"> · </span>{{ staffName }}
            }
          </p>
          <span class="waiter__live" [class.waiter__live--on]="socketLive">
            {{ socketLive ? 'Live' : 'Polling' }}
          </span>
        </div>
        <h1 class="waiter__venue">{{ venue }}</h1>
        <p class="waiter__calm">{{ calmLine }}</p>
      </header>

      @if (!detail) {
        <div class="waiter-seg" role="tablist" [attr.aria-label]="roleLabel">
          <button
            type="button"
            role="tab"
            class="waiter-seg__btn waiter-seg__btn--tables"
            [class.waiter-seg__btn--on]="tab === 'tables'"
            (click)="setTab('tables')"
          >
            {{ placeNounPlural }}
            <span class="waiter-seg__n">{{ tables.length }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="waiter-seg__btn waiter-seg__btn--ready"
            [class.waiter-seg__btn--on]="tab === 'ready'"
            (click)="setTab('ready')"
          >
            Ready
            <span class="waiter-seg__n">{{ readyItemCount }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="waiter-seg__btn waiter-seg__btn--help"
            [class.waiter-seg__btn--on]="tab === 'help'"
            (click)="setTab('help')"
          >
            Help
            <span class="waiter-seg__n">{{ assistance.length }}</span>
          </button>
        </div>
      }

      @if (error) {
        <p class="waiter__alert" role="alert">{{ error }}</p>
      }
      @if (message) {
        <p class="waiter__flash" role="status">{{ message }}</p>
      }

      @if (detail) {
        <section class="waiter-sheet studio-motion-appear" [attr.aria-label]="placeNoun + ' detail'">
          <header class="waiter-sheet__head">
            <div>
              <p class="waiter-sheet__eyebrow">{{ placeNoun }}</p>
              <h2 class="waiter-sheet__title">{{ detail.placeCode }}</h2>
              <p class="waiter-sheet__meta">Idle {{ detail.idleMinutes }}m</p>
            </div>
            <button type="button" class="waiter-btn waiter-btn--ghost" (click)="closeDetail()">
              Close
            </button>
          </header>

          <div class="waiter-seg waiter-seg--compact" role="tablist" [attr.aria-label]="placeNoun + ' items'">
            <button
              type="button"
              role="tab"
              class="waiter-seg__btn waiter-seg__btn--tables"
              [class.waiter-seg__btn--on]="detailItemsTab === 'active'"
              (click)="detailItemsTab = 'active'"
            >
              Active
              <span class="waiter-seg__n">{{ detailActiveItems.length }}</span>
            </button>
            <button
              type="button"
              role="tab"
              class="waiter-seg__btn waiter-seg__btn--tables"
              [class.waiter-seg__btn--on]="detailItemsTab === 'history'"
              (click)="detailItemsTab = 'history'"
            >
              History
            </button>
          </div>

          <div class="waiter-sheet__list" [attr.aria-label]="placeNoun + ' items'">
            @if (detailLoading && !detailItems.length) {
              <p class="waiter__calm">Loading orders…</p>
            }
            @for (
              item of detailItemsTab === 'active' ? detailActiveItems : detailHistoryItems;
              track item.fulfilmentId + item.label
            ) {
              <div class="waiter-line" [attr.data-tone]="itemTone(item.status)">
                <span class="waiter-line__label">{{ item.label }}</span>
                <span class="waiter-pill" [attr.data-tone]="itemTone(item.status)">
                  {{ statusLabel(item.status) }}
                </span>
                @if (item.status === 'ready' && detailItemsTab === 'active' && !monitorMode && canServeStation(item.stationId)) {
                  <button
                    type="button"
                    class="waiter-btn waiter-btn--mint waiter-btn--compact"
                    [disabled]="busy"
                    (click)="serveItem(item)"
                  >
                    {{ serveHint }}
                  </button>
                } @else {
                  <span class="waiter-line__meta">{{ stationShort(item.stationId) }}</span>
                }
              </div>
            } @empty {
              @if (!detailLoading) {
                <p class="waiter__calm">
                  @if (detailItemsTab === 'active') {
                    No active items on this {{ placeNoun.toLowerCase() }}.
                  } @else {
                    Nothing served yet.
                  }
                </p>
              }
            }
          </div>

          @if (!monitorMode) {
            <div class="waiter-sheet__actions">
              <button
                type="button"
                class="waiter-btn waiter-btn--mint"
                [disabled]="busy || !detailReadyCount"
                (click)="serveAllReadyOnDetail()"
              >
                {{ detailReadyCount ? serveNextLabel + ' (' + detailReadyCount + ')' : 'All clear' }}
              </button>
              <button type="button" class="waiter-btn waiter-btn--ghost" [disabled]="busy" (click)="clearDetailTable()">
                Clear {{ placeNoun.toLowerCase() }}
              </button>
            </div>
          }
        </section>
      } @else if (tab === 'tables') {
        <section class="waiter-stack" [attr.aria-label]="'Active ' + placeNounPlural.toLowerCase()">
          @for (t of tables; track t.sessionId) {
            <button
              type="button"
              class="waiter-card waiter-card--tables"
              [class.waiter-card--pulse-idle]="isIdlePulse(t)"
              (click)="openTable(t)"
            >
              <div class="waiter-card__top">
                <span class="waiter-card__table">{{ placeNoun }} {{ t.placeCode }}</span>
                <span class="waiter-card__age">Idle {{ t.idleMinutes }}m</span>
              </div>
              <div class="waiter-card__pills">
                @if (t.readyCount) {
                  <span class="waiter-pill" data-tone="ready">{{ t.readyCount }} ready</span>
                }
                @if (t.preparingCount) {
                  <span class="waiter-pill" data-tone="prep">{{ t.preparingCount }} preparing</span>
                }
                @if (t.pendingCount) {
                  <span class="waiter-pill" data-tone="new">{{ t.pendingCount }} new</span>
                }
                @if (t.helpCount) {
                  <span class="waiter-pill" data-tone="help">Help</span>
                }
                @if (!t.readyCount && !t.preparingCount && !t.pendingCount && !t.helpCount) {
                  <span class="waiter-pill" data-tone="muted">
                    {{ t.orderCount ? t.orderCount + ' orders' : 'Open' }}
                  </span>
                }
              </div>
              @if (tableItems(t).length) {
                <ul class="waiter-check">
                  @for (item of tableItems(t); track item.fulfilmentId + item.label) {
                    <li class="waiter-check__row" [attr.data-tone]="itemTone(item.status)">
                      <span class="waiter-check__mark" aria-hidden="true">
                        {{ item.status === 'ready' ? '✓' : '○' }}
                      </span>
                      <span>{{ item.quantity }}× {{ item.label }}</span>
                      <span class="waiter-check__meta">{{ stationShort(item.stationId) }}</span>
                    </li>
                  }
                </ul>
              } @else {
                <p class="waiter-card__empty">No orders yet — waiting for guests.</p>
              }
              @if (isIdlePulse(t)) {
                <p class="waiter-card__nudge">Needs a look</p>
              }
            </button>
          } @empty {
            <p class="waiter__calm">No active {{ placeNounPlural.toLowerCase() }} — guests who join a QR appear here.</p>
          }
        </section>
      } @else if (tab === 'ready') {
        <section class="waiter-stack" aria-label="Ready to serve">
          @for (g of readyGroups; track g.key) {
            <article
              class="waiter-card waiter-card--ready"
              [class.waiter-card--flash]="g.flash"
            >
              <div class="waiter-card__top">
                <span class="waiter-card__table">{{ placeNoun }} {{ g.place }}</span>
                <span class="waiter-card__age">
                  {{ g.readyCount }} ready
                  @if (g.idleMinutes != null) {
                    · Idle {{ g.idleMinutes }}m
                  }
                </span>
              </div>
              <ul class="waiter-check">
                @for (line of g.lines; track line.fulfilmentId + line.label) {
                  <li class="waiter-check__row" [attr.data-tone]="itemTone(line.status)">
                    <span class="waiter-check__mark" aria-hidden="true">
                      {{ line.status === 'ready' ? '✓' : '○' }}
                    </span>
                    <span>{{ line.quantity }}× {{ line.label }}</span>
                    <span class="waiter-check__meta">
                      {{ stationShort(line.stationId) }} · {{ statusLabel(line.status) }}
                    </span>
                  </li>
                }
              </ul>
              @if (!monitorMode) {
                <div class="waiter-card__actions">
                  <button
                    type="button"
                    class="waiter-btn waiter-btn--mint"
                    [disabled]="busy || !g.readyCount"
                    (click)="serveGroup(g)"
                  >
                    Serve {{ placeNoun }}
                  </button>
                </div>
              }
            </article>
          } @empty {
            <p class="waiter__calm">Nothing ready to serve — kitchen and bar hand off here.</p>
          }
        </section>
      } @else if (tab === 'help') {
        <section class="waiter-stack" aria-label="Help">
          @for (req of assistance; track req.id) {
            <article
              class="waiter-card waiter-card--help"
              [class.waiter-card--breathe]="isHelpUrgent(req) && !isManagerHelp(req)"
              [class.waiter-card--manager]="isManagerHelp(req)"
            >
              <div class="waiter-card__top">
                <span class="waiter-card__table">{{ placeFor(req) }}</span>
                <span class="waiter-card__age">{{ helpStatusLabel(req) }}</span>
              </div>
              <p class="waiter-card__kind">{{ kindLabel(req.kind) }}</p>
              @if (isManagerHelp(req)) {
                <p class="waiter-card__studio">{{ managerPulseNoun }} — claimed in Studio Operate</p>
              } @else if (!monitorMode) {
                <div class="waiter-card__actions waiter-card__actions--split">
                  @if (req.status !== 'acknowledged') {
                    <button
                      type="button"
                      class="waiter-btn waiter-btn--coral"
                      [disabled]="busy"
                      (click)="acknowledge(req.id)"
                    >
                      Acknowledge
                    </button>
                  }
                  <button
                    type="button"
                    class="waiter-btn waiter-btn--ghost"
                    [disabled]="busy"
                    (click)="resolve(req.id)"
                  >
                    Resolve
                  </button>
                </div>
              }
            </article>
          } @empty {
            <p class="waiter__calm">No open help requests.</p>
          }
        </section>
      }

      @if (!monitorMode) {
        <p class="waiter__foot">
          <a class="waiter__foot-a" routerLink="/staff">Switch</a>
          @for (s of visibleStations; track s.id) {
            <span class="waiter__foot-sep" aria-hidden="true">·</span>
            <a class="waiter__foot-a" [routerLink]="s.path">{{ s.label }}</a>
          }
        </p>
      } @else {
        <p class="waiter__foot">
          <a class="waiter__foot-a" routerLink="/studio/operate">Overview</a>
        </p>
      }

      @if (!monitorMode) {
        <div class="waiter-sticky">
          <button
            type="button"
            class="waiter-sticky__btn"
            [attr.data-tint]="stickyTint"
            [disabled]="busy || stickyTint === 'clear'"
            (click)="stickyAction()"
          >
            {{ stickyLabel }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        --w-blue: #e7f0ff;
        --w-blue-accent: #4a7fd4;
        --w-blue-ink: #1e3a6e;
        --w-mint: #e4f6ea;
        --w-mint-accent: #3d9a68;
        --w-mint-ink: #1f6b45;
        --w-coral: #ffe8dc;
        --w-coral-accent: #e86b4a;
        --w-coral-ink: #8f3a26;
        --w-ink: #1b2230;
        --w-muted: #6b7280;
      }
      .waiter {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        padding-bottom: 5.5rem;
        max-width: 36rem;
        margin: 0 auto;
      }
      .waiter__header {
        padding-top: 0.25rem;
      }
      .waiter__title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .waiter__eyebrow {
        margin: 0;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--w-muted);
      }
      .waiter__live {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-height: 1.5rem;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 750;
        background: #eef0f3;
        color: var(--w-muted);
      }
      .waiter__live--on {
        background: var(--w-mint);
        color: var(--w-mint-ink);
      }
      .waiter__live--on::before {
        content: '';
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: var(--w-mint-accent);
      }
      .waiter__venue {
        margin: 0.35rem 0 0;
        font-family: 'Fraunces', Georgia, serif;
        font-size: clamp(1.65rem, 3vw, 2.1rem);
        font-weight: 650;
        letter-spacing: -0.03em;
        color: var(--w-ink);
      }
      .waiter__calm {
        margin: 0.45rem 0 0;
        font-size: 0.95rem;
        color: var(--w-muted);
        line-height: 1.4;
      }
      .waiter__alert {
        margin: 0;
        color: #b42318;
        font-weight: 600;
      }
      .waiter__flash {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 650;
        color: var(--w-mint-ink);
      }

      .waiter-seg {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.4rem;
        padding: 0.35rem;
        border-radius: 1rem;
        background: #eef0f3;
      }
      .waiter-seg--compact {
        grid-template-columns: 1fr 1fr;
      }
      .waiter-seg__btn {
        min-height: 2.85rem;
        padding: 0.35rem 0.5rem;
        border: 0;
        border-radius: 0.75rem;
        background: transparent;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--w-muted);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        transition:
          background 220ms ease-out,
          color 220ms ease-out;
      }
      .waiter-seg__n {
        min-width: 1.35rem;
        height: 1.35rem;
        padding: 0 0.35rem;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 750;
        background: #fff;
        color: var(--w-ink);
      }
      .waiter-seg__btn--on.waiter-seg__btn--tables {
        background: var(--w-blue);
        color: var(--w-blue-ink);
      }
      .waiter-seg__btn--on.waiter-seg__btn--ready {
        background: var(--w-mint);
        color: var(--w-mint-ink);
      }
      .waiter-seg__btn--on.waiter-seg__btn--help {
        background: var(--w-coral);
        color: var(--w-coral-ink);
      }
      .waiter-seg__btn--on .waiter-seg__n {
        background: #fff;
        color: var(--w-ink);
      }

      .waiter-stack {
        display: grid;
        gap: 0.75rem;
      }
      .waiter-card {
        display: grid;
        gap: 0.65rem;
        width: 100%;
        text-align: left;
        padding: 1rem 1.05rem;
        border-radius: 1.1rem;
        border: 0;
        background: #fff;
        box-shadow: 0 1px 0 rgba(27, 34, 48, 0.04);
        font: inherit;
        color: var(--w-ink);
        cursor: default;
        transition:
          background 220ms ease-out,
          box-shadow 220ms ease-out,
          transform 220ms ease-out;
      }
      button.waiter-card {
        cursor: pointer;
      }
      button.waiter-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(27, 34, 48, 0.07);
      }
      .waiter-card--tables {
        background: color-mix(in srgb, var(--w-blue) 55%, #fff);
      }
      .waiter-card--ready {
        background: color-mix(in srgb, var(--w-mint) 60%, #fff);
      }
      .waiter-card--help {
        background: color-mix(in srgb, var(--w-coral) 60%, #fff);
      }
      .waiter-card--manager {
        background: color-mix(in srgb, var(--w-sand, #f7f1e8) 70%, #fff);
        border: 1px solid color-mix(in srgb, var(--w-ink, #2a2118) 12%, transparent);
      }
      .waiter-card__studio {
        margin: 0.4rem 0 0;
        font-size: 0.85rem;
        color: color-mix(in srgb, var(--w-ink, #2a2118) 55%, transparent);
        font-style: italic;
      }
      .waiter-card--flash {
        animation: waiter-ready-flash 220ms ease-out;
      }
      .waiter-card--breathe {
        animation: waiter-breathe 2s ease-in-out infinite;
      }
      .waiter-card--pulse-idle {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--w-coral-accent) 35%, transparent);
      }
      @keyframes waiter-ready-flash {
        from {
          background: var(--w-blue);
          transform: scale(0.99);
        }
        to {
          background: color-mix(in srgb, var(--w-mint) 60%, #fff);
          transform: scale(1);
        }
      }
      @keyframes waiter-breathe {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.85;
        }
      }
      .waiter-card__top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.65rem;
      }
      .waiter-card__table {
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.15;
        color: var(--w-ink);
      }
      .waiter-card__age {
        font-size: 0.75rem;
        font-weight: 650;
        color: var(--w-muted);
        white-space: nowrap;
      }
      .waiter-card__pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .waiter-card__kind {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 650;
        color: var(--w-coral-ink);
      }
      .waiter-card__empty {
        margin: 0;
        font-size: 0.85rem;
        color: var(--w-muted);
      }
      .waiter-card__nudge {
        margin: 0;
        font-size: 0.78rem;
        font-weight: 750;
        color: var(--w-coral-ink);
      }
      .waiter-card__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.45rem;
        margin-top: 0.15rem;
      }
      .waiter-card__actions--split {
        justify-content: stretch;
      }
      .waiter-card__actions--split .waiter-btn {
        flex: 1;
      }

      .waiter-pill {
        display: inline-flex;
        align-items: center;
        min-height: 1.5rem;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 750;
        color: var(--w-ink);
        background: #eef0f3;
      }
      .waiter-pill[data-tone='ready'] {
        background: var(--w-mint);
        color: var(--w-mint-ink);
      }
      .waiter-pill[data-tone='prep'] {
        background: #fff4e5;
        color: #8a4b08;
      }
      .waiter-pill[data-tone='new'] {
        background: var(--w-blue);
        color: var(--w-blue-ink);
      }
      .waiter-pill[data-tone='help'] {
        background: var(--w-coral);
        color: var(--w-coral-ink);
      }
      .waiter-pill[data-tone='muted'] {
        background: #eef0f3;
        color: var(--w-muted);
      }

      .waiter-check {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.4rem;
      }
      .waiter-check__row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.45rem;
        align-items: baseline;
        font-size: 0.875rem;
        font-weight: 600;
      }
      .waiter-check__mark {
        width: 1rem;
        text-align: center;
        font-weight: 800;
        color: var(--w-muted);
      }
      .waiter-check__row[data-tone='ready'] .waiter-check__mark {
        color: var(--w-mint-accent);
      }
      .waiter-check__meta {
        font-size: 0.7rem;
        font-weight: 650;
        color: var(--w-muted);
      }

      .waiter-btn {
        min-height: 2.75rem;
        min-width: 2.75rem;
        padding: 0 1rem;
        border-radius: 0.85rem;
        border: 0;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 750;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition:
          opacity 160ms ease,
          transform 160ms ease;
      }
      .waiter-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .waiter-btn--compact {
        min-height: 2.75rem;
        padding: 0 0.85rem;
      }
      .waiter-btn--mint {
        background: var(--w-mint-accent);
        color: #fff;
      }
      .waiter-btn--coral {
        background: var(--w-coral-accent);
        color: #fff;
      }
      .waiter-btn--ghost {
        background: #fff;
        color: var(--w-ink);
        border: 1px solid #e2e5ea;
      }

      .waiter-sheet {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border-radius: 1.15rem;
        background: color-mix(in srgb, var(--w-blue) 40%, #fff);
      }
      .waiter-sheet__head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .waiter-sheet__eyebrow {
        margin: 0;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--w-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .waiter-sheet__title {
        margin: 0.2rem 0 0;
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .waiter-sheet__meta {
        margin: 0.25rem 0 0;
        font-size: 0.8rem;
        color: var(--w-muted);
      }
      .waiter-sheet__list {
        display: grid;
        gap: 0.45rem;
      }
      .waiter-line {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0.5rem;
        align-items: center;
        padding: 0.75rem 0.85rem;
        border-radius: 0.85rem;
        background: #fff;
      }
      .waiter-line__label {
        font-weight: 650;
      }
      .waiter-line__meta {
        font-size: 0.75rem;
        color: var(--w-muted);
        font-weight: 650;
      }
      .waiter-sheet__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .waiter__foot {
        margin: 0.25rem 0 0;
        font-size: 0.8125rem;
        color: var(--w-muted);
      }
      .waiter__foot-a {
        color: var(--w-ink);
        font-weight: 650;
        text-decoration: none;
      }
      .waiter__foot-a:hover {
        text-decoration: underline;
      }
      .waiter__foot-sep {
        margin: 0 0.35rem;
      }

      .waiter-sticky {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 20;
        padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
        background: linear-gradient(180deg, transparent, rgba(246, 243, 238, 0.92) 28%);
        pointer-events: none;
      }
      .waiter-sticky__btn {
        pointer-events: auto;
        display: flex;
        width: min(36rem, 100%);
        margin: 0 auto;
        min-height: 3.15rem;
        padding: 0 1.1rem;
        border: 0;
        border-radius: 1rem;
        font: inherit;
        font-size: 0.95rem;
        font-weight: 800;
        letter-spacing: -0.01em;
        cursor: pointer;
        color: #fff;
        background: #9aa1ab;
        box-shadow: 0 10px 24px rgba(27, 34, 48, 0.12);
        transition:
          background 220ms ease-out,
          opacity 160ms ease;
      }
      .waiter-sticky__btn[data-tint='help'] {
        background: var(--w-coral-accent);
      }
      .waiter-sticky__btn[data-tint='ready'] {
        background: var(--w-mint-accent);
      }
      .waiter-sticky__btn[data-tint='clear'] {
        background: #c5c9d0;
        color: #4b5563;
        cursor: default;
      }
      .waiter-sticky__btn:disabled {
        opacity: 0.85;
      }
    `,
  ],
})
export class ServicePageComponent implements OnInit, OnDestroy {
  private readonly api = inject(LeosApiService);
  private readonly ctx = inject(StudioContextService);
  private readonly staffSession = inject(OperateStaffSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly state = inject(SessionStateService);
  readonly terms = inject(TerminologyService);

  venue = 'Your experience';
  tab: FloorTab = 'tables';
  message = '';
  error = '';
  busy = false;
  assistance: HelpReq[] = [];
  readyRows: ReadyRow[] = [];
  readyGroups: ReadyGroup[] = [];
  tables: TableRow[] = [];
  stations: OperateDoor[] = [];
  emptyLine = 'You’re clear.';
  floorKind: 'cafe' | 'restaurant' | 'generic' = 'restaurant';
  roleLabel = 'Waiter';
  staffName = '';
  monitorMode = false;
  socketLive = false;
  detail: TableRow | null = null;
  detailItems: TableItem[] = [];
  detailItemsTab: DetailItemsTab = 'active';
  detailLoading = false;
  private placeCodes: string[] = [];
  placeNoun = 'Table';
  placeNounPlural = 'Tables';
  private experienceTypeId: ExperienceTypeId = 'restaurant';
  private poll?: ReturnType<typeof setInterval>;
  private unsubPlatform?: () => void;
  private organisationId = '';
  private prevReadyKeys = new Set<string>();
  private nowMs = Date.now();

  get visibleStations() {
    return this.stations.filter((s) => this.staffSession.canAccessRole(s.role));
  }

  get readyItemCount() {
    return this.readyGroups.reduce((n, g) => n + g.readyCount, 0);
  }

  get calmLine() {
    const place = this.placeNoun.toLowerCase();
    const places = this.placeNounPlural.toLowerCase();
    if (this.detail) {
      return this.detailReadyCount
        ? `${this.detailReadyCount} ready to serve at ${this.placeNoun} ${this.detail.placeCode}`
        : `${this.placeNoun} ${this.detail.placeCode}`;
    }
    if (this.tab === 'tables') {
      return this.tables.length
        ? `${this.tables.length} active ${this.tables.length === 1 ? place : places}`
        : `No active ${places} — you’re clear.`;
    }
    if (this.tab === 'ready') {
      return this.readyItemCount
        ? `${this.readyItemCount} ready across ${this.readyGroups.length} ${this.readyGroups.length === 1 ? place : places}`
        : 'Nothing ready to serve — you’re clear.';
    }
    return this.serviceHelpCount ? `${this.serviceHelpCount} need you` : this.emptyLine;
  }

  get detailActiveItems() {
    return this.detailItems.filter(
      (i) => !['delivered', 'completed', 'cancelled'].includes(i.status),
    );
  }

  get detailHistoryItems() {
    return this.detailItems.filter((i) =>
      ['delivered', 'completed', 'cancelled'].includes(i.status),
    );
  }

  get detailReadyCount() {
    return this.detailActiveItems.filter(
      (i) => i.status === 'ready' && this.canServeStation(i.stationId),
    ).length;
  }

  get serveNextLabel() {
    return floorServeCta(this.floorKind);
  }

  get serveHint() {
    return floorServeHint(this.floorKind);
  }

  get stickyTint(): StickyTint {
    if (this.detail) {
      return this.detailReadyCount ? 'ready' : 'clear';
    }
    if (this.serviceHelpCount) return 'help';
    if (this.readyGroups.some((g) => g.readyCount > 0)) return 'ready';
    return 'clear';
  }

  get stickyLabel(): string {
    if (this.detail) {
      return this.detailReadyCount
        ? `Serve Next — ${this.placeNoun} ${this.detail.placeCode} (${this.detailReadyCount} item${this.detailReadyCount === 1 ? '' : 's'})`
        : 'All Caught Up';
    }
    const help = this.nextHelp();
    if (help) {
      const place = this.placeFor(help);
      return help.status === 'acknowledged'
        ? `Resolve Help — ${place}`
        : `Acknowledge Help — ${place}`;
    }
    const group = this.nextReadyGroup();
    if (group) {
      return `Serve Next — ${this.placeNoun} ${group.place} (${group.readyCount} item${group.readyCount === 1 ? '' : 's'})`;
    }
    return 'All Caught Up';
  }

  ngOnInit() {
    this.monitorMode = this.router.url.includes('monitor=1');
    if (!this.requireStaff()) return;
    this.venue = this.ctx.displayVenue();
    const cfg = this.ctx.readConfig();
    const typeId = (cfg.typeId || 'restaurant') as ExperienceTypeId;
    this.stations = stationDoors(typeId);
    this.floorKind =
      typeId === 'cafe' || typeId === 'airport' || typeId === 'festival' ? 'cafe' : 'restaurant';
    this.roleLabel = floorRoleLabel(this.floorKind);
    const who = this.staffSession.read();
    this.staffName = who?.displayName?.split('·')[0]?.trim() || who?.displayName || '';
    this.organisationId = who?.organisationId || '';
    this.emptyLine = `${this.roleLabel} is calm — Assist will appear here.`;

    const active = this.ctx.activeExperience();
    this.placeCodes =
      active?.placeCodes?.length ? active.placeCodes : active?.placeCode ? [active.placeCode] : [];
    this.experienceTypeId = typeId;
    const def = getExperience(typeId);
    this.placeNoun = def?.terminology.place ?? 'Table';
    this.placeNounPlural = def?.defaults.placeLabel ?? `${this.placeNoun}s`;

    this.state.restore();
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'ready' || tab === 'help' || tab === 'tables') this.tab = tab;

    this.bindOperateSocket();
    this.refresh();
    this.poll = setInterval(() => {
      this.nowMs = Date.now();
      this.socketLive = this.api.isSocketConnected();
      this.refresh(true);
    }, this.api.isSocketConnected() ? 8000 : 4000);
  }

  ngOnDestroy() {
    if (this.poll) clearInterval(this.poll);
    this.unsubPlatform?.();
  }

  setTab(tab: FloorTab) {
    this.tab = tab;
    this.detail = null;
  }

  private bindOperateSocket() {
    this.unsubPlatform?.();
    if (!this.organisationId) return;
    this.api.ensureOperateSocket(this.organisationId, 'waiter');
    this.socketLive = this.api.isSocketConnected();
    this.unsubPlatform = this.api.onPlatformEvent((envelope) => this.onOperateEvent(envelope));
  }

  private onOperateEvent(envelope: PlatformEventEnvelope) {
    const name = envelope?.eventName ?? '';
    const refreshOn = new Set([
      'FulfilmentCreated',
      'FulfilmentStatusChanged',
      'TransactionCreated',
      'SessionCompleted',
      'AssistanceRequested',
      'AssistanceAcknowledged',
      'AssistanceResolved',
    ]);
    if (!refreshOn.has(name)) return;
    this.socketLive = true;
    this.refresh(true);
    if (this.detail) this.loadDetail(this.detail.sessionId, true);
  }

  private requireStaff(): boolean {
    const monitor = this.router.url.includes('monitor=1');
    if (monitor) return true;
    if (!this.staffSession.isSignedIn()) {
      void this.router.navigate(['/staff'], {
        queryParams: { next: '/staff/service' },
      });
      return false;
    }
    const who = this.staffSession.read();
    if (!who) return false;
    if (!this.staffSession.canOpenWaiterBoard()) {
      void this.router.navigateByUrl(who.homePath);
      return false;
    }
    return true;
  }

  /** Waiter serves every station. Kitchen / Bar only complete their own handoff. */
  canServeStation(stationId: string): boolean {
    const role = this.staffSession.read()?.role || '';
    if (!role || role === 'waiter' || role === 'staff') return true;
    const id = (stationId || '').toLowerCase();
    if (role === 'bar') return id.includes('bar');
    if (role === 'kitchen') {
      return (
        id.includes('kitchen') ||
        id.includes('food-truck') ||
        id.includes('room-service') ||
        (!id.includes('bar') && !id.includes('counter'))
      );
    }
    return false;
  }

  kindLabel(kind: string): string {
    if (kind === 'manager') return guestManagerAssistCopy(this.experienceTypeId).label;
    if (kind === 'service') return guestServiceAssistCopy(this.experienceTypeId).label;
    if (!kind) return 'Help';
    return kind.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  isManagerHelp(req: HelpReq): boolean {
    return req.kind === 'manager';
  }

  get managerPulseNoun(): string {
    const label = guestManagerAssistCopy(this.experienceTypeId).label;
    const stripped = label.replace(/^Speak to (the )?/i, '').trim();
    return stripped ? stripped.replace(/^./, (c) => c.toUpperCase()) : 'Manager';
  }

  get serviceHelpCount(): number {
    return this.assistance.filter((a) => a.kind !== 'manager').length;
  }

  placeFor(req: HelpReq): string {
    const fromTable = this.tables.find((t) => t.sessionId === req.sessionId);
    if (fromTable) return `${this.placeNoun} ${fromTable.placeCode}`;
    if (this.placeCodes.length) {
      let hash = 0;
      const key = req.sessionId || req.id;
      for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i)) % this.placeCodes.length;
      return `${this.placeNoun} ${this.placeCodes[hash] ?? this.placeCodes[0]}`;
    }
    const msg = (req.message || '').trim();
    if (msg && msg.length <= 24) return msg;
    return this.placeNoun;
  }

  isHelpUrgent(req: HelpReq): boolean {
    if (!req.createdAt) return false;
    const age = this.nowMs - new Date(req.createdAt).getTime();
    return age >= 3 * 60 * 1000;
  }

  refresh(silent = false) {
    this.socketLive = this.api.isSocketConnected();
    const calls = Object.fromEntries(
      this.stations.map((s) => [
        s.id,
        this.api.listFulfilments(s.apiId!).pipe(catchError(() => of([]))),
      ]),
    );

    forkJoin({
      ...calls,
      assistance: this.api.listAssistance().pipe(catchError(() => of([]))),
      floor: this.api.listFloorTables().pipe(catchError(() => of({ tables: [] }))),
    }).subscribe({
      next: (bundle) => {
        if (!silent) this.error = '';
        const assistance = (
          bundle as { assistance: HelpReq[] }
        ).assistance;
        this.assistance = assistance
          .filter((a) => a.status !== 'resolved')
          .sort((a, b) => {
            const aOpen = a.status === 'acknowledged' ? 1 : 0;
            const bOpen = b.status === 'acknowledged' ? 1 : 0;
            if (aOpen !== bOpen) return aOpen - bOpen;
            return (a.createdAt || '').localeCompare(b.createdAt || '');
          });

        const floor = (bundle as { floor: { tables: TableRow[] } }).floor;
        this.tables = (floor.tables ?? []).map((t) => ({
          ...t,
          preparingCount: t.preparingCount ?? 0,
          pendingCount: t.pendingCount ?? 0,
          items: t.items ?? [],
        }));

        if (this.detail) {
          const live = this.tables.find((t) => t.sessionId === this.detail!.sessionId);
          if (live) this.detail = { ...this.detail, ...live };
        }

        const placeBySession = new Map(this.tables.map((t) => [t.sessionId, t.placeCode]));

        const ready: ReadyRow[] = [];
        for (const station of this.stations) {
          const items = (bundle as Record<string, unknown>)[station.id] as Array<{
            id: string;
            status: string;
            sessionId?: string;
            lines: Array<{ label?: string; quantity: number }>;
          }>;
          if (!Array.isArray(items)) continue;
          for (const f of items.filter((x) => x.status === 'ready')) {
            if (!this.canServeStation(station.apiId || station.id)) continue;
            const label =
              f.lines?.length
                ? f.lines.map((l) => `${l.quantity}× ${l.label ?? 'item'}`).join(', ')
                : station.label;
            const placeCode =
              (f.sessionId && placeBySession.get(f.sessionId)) || this.placeHash(f.id);
            ready.push({
              id: `${station.id}-${f.id}`,
              place: placeCode,
              label,
              stationPath: station.path,
              fulfilmentId: f.id,
              sessionId: f.sessionId,
            });
          }
        }
        this.readyRows = ready;
        this.rebuildReadyGroups();
      },
      error: () => {
        if (!silent) this.error = `Couldn’t load ${this.roleLabel} — try again shortly.`;
      },
    });
  }

  private rebuildReadyGroups() {
    const byKey = new Map<string, ReadyGroup>();

    for (const t of this.tables) {
      const items = t.items ?? [];
      const hasReady = items.some(
        (i) => (i.status || '').toLowerCase() === 'ready' && this.canServeStation(i.stationId),
      );
      if (!hasReady) continue;
      const lines: ReadyLine[] = items
        .filter((i) => !['delivered', 'completed', 'cancelled'].includes((i.status || '').toLowerCase()))
        .filter((i) => this.canServeStation(i.stationId))
        .map((i) => ({
          fulfilmentId: i.fulfilmentId,
          label: i.label,
          stationId: i.stationId,
          status: (i.status || '').toLowerCase(),
          quantity: i.quantity,
        }));
      const readyCount = lines.filter((l) => l.status === 'ready').length;
      byKey.set(t.sessionId, {
        key: t.sessionId,
        place: t.placeCode,
        sessionId: t.sessionId,
        readyCount,
        lines,
        idleMinutes: t.idleMinutes,
        flash: false,
      });
    }

    // Fallback: station ready rows without floor session match
    for (const row of this.readyRows) {
      const key = row.sessionId || `place:${row.place}`;
      if (byKey.has(key)) continue;
      const existing = [...byKey.values()].find(
        (g) => g.place === row.place || g.place === row.place.replace(/^Table\s+/i, ''),
      );
      if (existing) {
        if (!existing.lines.some((l) => l.fulfilmentId === row.fulfilmentId)) {
          existing.lines.push({
            fulfilmentId: row.fulfilmentId,
            label: row.label,
            stationId: '',
            status: 'ready',
            quantity: 1,
          });
          existing.readyCount += 1;
        }
        continue;
      }
      byKey.set(key, {
        key,
        place: row.place.replace(/^Table\s+/i, ''),
        sessionId: row.sessionId,
        readyCount: 1,
        lines: [
          {
            fulfilmentId: row.fulfilmentId,
            label: row.label,
            stationId: '',
            status: 'ready',
            quantity: 1,
          },
        ],
        flash: false,
      });
    }

    const next = [...byKey.values()].sort((a, b) => b.readyCount - a.readyCount || a.place.localeCompare(b.place));
    const nextKeys = new Set(next.map((g) => g.key));
    for (const g of next) {
      g.flash = !this.prevReadyKeys.has(g.key);
    }
    this.prevReadyKeys = nextKeys;
    this.readyGroups = next;
    // Clear flash after transition
    if (next.some((g) => g.flash)) {
      setTimeout(() => {
        this.readyGroups = this.readyGroups.map((g) => ({ ...g, flash: false }));
      }, 260);
    }
  }

  private placeHash(id: string): string {
    if (this.placeCodes.length) {
      let hash = 0;
      for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % this.placeCodes.length;
      return this.placeCodes[hash] ?? this.placeCodes[0];
    }
    return id.slice(-4).toUpperCase();
  }

  statusLabel(status: string): string {
    return guestStatusLabel(status);
  }

  stationShort(stationId: string): string {
    const id = (stationId || '').toLowerCase();
    if (id.includes('bar')) return 'Bar';
    if (id.includes('counter')) return 'Counter';
    if (id.includes('kitchen')) return 'Kitchen';
    return 'Station';
  }

  openTable(t: TableRow) {
    this.detail = t;
    this.detailItemsTab = 'active';
    this.detailItems = (t.items ?? []).map((i) => ({
      fulfilmentId: i.fulfilmentId,
      label: `${i.quantity}× ${i.label}`,
      status: (i.status || '').toLowerCase(),
      stationId: i.stationId,
    }));
    this.loadDetail(t.sessionId);
  }

  isIdlePulse(t: TableRow): boolean {
    return isTableIdlePulsing(t.idleMinutes);
  }

  closeDetail() {
    this.detail = null;
    this.detailItems = [];
  }

  loadDetail(sessionId: string, silent = false) {
    if (!silent) this.detailLoading = true;
    this.api.getSession(sessionId).subscribe({
      next: (session) => {
        this.detailLoading = false;
        if (!session) {
          this.closeDetail();
          this.refresh(true);
          return;
        }
        if (this.detail && this.detail.sessionId === sessionId && session.placeCode) {
          this.detail = { ...this.detail, placeCode: session.placeCode };
        }
        const items: TableItem[] = [];
        for (const f of session.fulfilments ?? []) {
          const lines = f.lines?.length
            ? f.lines
            : [{ label: this.stationShort(f.stationId), quantity: 1 }];
          for (const line of lines) {
            items.push({
              fulfilmentId: f.id,
              label: `${line.quantity}× ${line.label ?? 'item'}`,
              status: (f.status || '').toLowerCase(),
              stationId: f.stationId,
            });
          }
        }
        this.detailItems = items;
      },
      error: () => {
        this.detailLoading = false;
        if (!silent) this.error = 'Couldn’t open table — try again.';
      },
    });
  }

  tableItems(t: TableRow) {
    return t.items ?? [];
  }

  itemTone(status: string): 'ready' | 'prep' | 'new' | 'help' | 'muted' {
    const s = (status || '').toLowerCase();
    if (s === 'ready') return 'ready';
    if (s === 'preparing' || s === 'confirmed') return 'prep';
    if (s === 'delivered' || s === 'completed') return 'muted';
    return 'new';
  }

  private onStaffMutationError(err: { status?: number }, fallback: string) {
    this.busy = false;
    if (err?.status === 401) {
      this.staffSession.clear();
      this.error = 'Session ended — enter your PIN again.';
      void this.router.navigate(['/staff'], {
        queryParams: { next: '/staff/service' },
      });
      return;
    }
    if (err?.status === 403) {
      this.error = 'This Experience can’t do that.';
      return;
    }
    this.error = fallback;
  }

  private nextHelp(): HelpReq | null {
    const service = this.assistance.filter((a) => a.kind !== 'manager');
    return service.find((a) => a.status !== 'acknowledged') || service[0] || null;
  }

  private nextReadyGroup(): ReadyGroup | null {
    return this.readyGroups.find((g) => g.readyCount > 0) || null;
  }

  stickyAction() {
    if (this.monitorMode || this.busy) return;
    if (this.detail) {
      this.serveAllReadyOnDetail();
      return;
    }
    const help = this.nextHelp();
    if (help) {
      this.tab = 'help';
      if (help.status === 'acknowledged') this.resolve(help.id);
      else this.acknowledge(help.id);
      return;
    }
    const group = this.nextReadyGroup();
    if (group) {
      this.tab = 'ready';
      this.serveGroup(group);
    }
  }

  serveItem(item: TableItem) {
    if (!this.canServeStation(item.stationId)) return;
    this.busy = true;
    this.error = '';
    this.api.updateFulfilmentStatus(item.fulfilmentId, 'delivered').subscribe({
      next: () => {
        this.busy = false;
        this.message = floorServeFlash(this.floorKind);
        setTimeout(() => (this.message = ''), 1800);
        if (this.detail) this.loadDetail(this.detail.sessionId, true);
        this.refresh(true);
      },
      error: (err: { status?: number }) => this.onStaffMutationError(err, 'Couldn’t update — try again.'),
    });
  }

  serveAllReadyOnDetail() {
    const ready = this.detailActiveItems.filter(
      (i) => i.status === 'ready' && this.canServeStation(i.stationId),
    );
    const ids = [...new Set(ready.map((i) => i.fulfilmentId))];
    if (!ids.length) return;
    this.serveFulfilmentIds(ids);
  }

  serveGroup(group: ReadyGroup) {
    if (this.monitorMode) return;
    const ids = [
      ...new Set(
        group.lines
          .filter((l) => l.status === 'ready' && this.canServeStation(l.stationId))
          .map((l) => l.fulfilmentId),
      ),
    ];
    if (!ids.length) return;
    this.serveFulfilmentIds(ids);
  }

  private serveFulfilmentIds(ids: string[]) {
    this.busy = true;
    this.error = '';
    forkJoin(ids.map((id) => this.api.updateFulfilmentStatus(id, 'delivered'))).subscribe({
      next: () => {
        this.busy = false;
        this.message = floorServeFlash(this.floorKind);
        setTimeout(() => (this.message = ''), 1800);
        if (this.detail) this.loadDetail(this.detail.sessionId, true);
        this.refresh(true);
      },
      error: (err: { status?: number }) => this.onStaffMutationError(err, 'Couldn’t update — try again.'),
    });
  }

  clearDetailTable() {
    if (!this.detail) return;
    this.clearTable(this.detail);
  }

  helpStatusLabel(req: HelpReq): string {
    if (req.status === 'acknowledged') return 'On the way';
    return this.kindLabel(req.kind);
  }

  acknowledge(id: string) {
    if (this.monitorMode) return;
    this.busy = true;
    this.error = '';
    this.api.acknowledgeAssistance(id).subscribe({
      next: () => {
        this.busy = false;
        this.message = 'On the way — guest can see it.';
        setTimeout(() => (this.message = ''), 1800);
        this.refresh();
      },
      error: (err: { status?: number }) =>
        this.onStaffMutationError(err, 'Couldn’t acknowledge — try again.'),
    });
  }

  resolve(id: string) {
    if (this.monitorMode) return;
    this.busy = true;
    this.error = '';
    this.api.resolveAssistance(id).subscribe({
      next: () => {
        this.busy = false;
        this.message = 'Resolved — guest can continue.';
        setTimeout(() => (this.message = ''), 1800);
        this.refresh();
      },
      error: (err: { status?: number }) =>
        this.onStaffMutationError(err, 'Couldn’t resolve — try again.'),
    });
  }

  clearTable(t: TableRow) {
    if (!confirm(`Clear ${this.placeNoun} ${t.placeCode}? The visit will end.`)) return;
    this.busy = true;
    this.error = '';
    this.api.closeSession(t.sessionId).subscribe({
      next: () => {
        this.busy = false;
        this.message = `${this.placeNoun} ${t.placeCode} cleared.`;
        setTimeout(() => (this.message = ''), 1800);
        if (this.state.sessionId === t.sessionId) this.state.clear();
        if (this.detail?.sessionId === t.sessionId) this.closeDetail();
        this.refresh();
      },
      error: () => {
        this.busy = false;
        this.error = `Couldn’t clear ${this.placeNoun.toLowerCase()} — try again.`;
      },
    });
  }
}
