import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { guestStatusLabel, guestOrdersLegend } from '../studio/operate-status';

export type GuestOrderLine = {
  label: string;
  quantity: number;
  status?: string;
};

export type GuestOrder = {
  id: string;
  status: string;
  createdAt?: string | Date;
  lines: GuestOrderLine[];
};

type OrdersTab = 'active' | 'history';

const TERMINAL = new Set(['served', 'delivered', 'completed', 'cancelled']);

/**
 * Guest orders — ported from Restaurant App orders.page.
 * Active / History · status legend · order cards · ready banner.
 */
@Component({
  selector: 'leos-guest-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="go">
      @if (offlinePending) {
        <div class="go__banner go__banner--warn" role="status">
          Order saved. We’ll send it when you’re back online.
        </div>
      } @else if (sending) {
        <div class="go__banner" role="status">Sending your order…</div>
      }
      @if (recordedFlash) {
        <div class="go__banner go__banner--ok" role="status">
          {{
            offlinePending
              ? recordedPendingFlash
              : recordedOkFlash
          }}
        </div>
      }

      <div class="go__tabs" role="tablist" [attr.aria-label]="listAriaLabel">
        <button
          type="button"
          role="tab"
          class="go__tab"
          [class.go__tab--on]="tab === 'active'"
          [attr.aria-selected]="tab === 'active'"
          (click)="tab = 'active'"
        >
          Active
        </button>
        <button
          type="button"
          role="tab"
          class="go__tab"
          [class.go__tab--on]="tab === 'history'"
          [attr.aria-selected]="tab === 'history'"
          (click)="tab = 'history'"
        >
          History
        </button>
      </div>

      <div class="go__legend" aria-hidden="true">
        <span class="go__leg"><span class="go__dot go__dot--pending"></span> {{ legend.pending }}</span>
        <span class="go__leg"><span class="go__dot go__dot--prep"></span> {{ legend.prep }}</span>
        <span class="go__leg"><span class="go__dot go__dot--ready"></span> {{ legend.ready }}</span>
        <span class="go__leg"><span class="go__dot go__dot--served"></span> {{ legend.done }}</span>
      </div>

      @for (order of filtered; track order.id) {
        <article class="go__card" [class.go__card--ready]="norm(order.status) === 'ready'">
          <header class="go__head">
            <span class="go__num">{{ cardNoun }} · {{ shortId(order.id) }}</span>
            <span class="go__chip" [attr.data-status]="norm(order.status)">{{
              statusLabel(order.status)
            }}</span>
          </header>

          @if (norm(order.status) === 'ready') {
            <div class="go__ready" role="status">
              {{ readyHint || 'Your order is ready for you.' }}
            </div>
          }

          <ul class="go__items">
            @for (line of order.lines; track line.label + line.quantity) {
              <li class="go__item">
                <span class="go__item-dot" [attr.data-status]="norm(line.status || order.status)"></span>
                <span class="go__item-label">{{ line.label }} × {{ line.quantity }}</span>
                <span class="go__chip go__chip--sm" [attr.data-status]="norm(line.status || order.status)">{{
                  statusLabel(line.status || order.status)
                }}</span>
              </li>
            }
          </ul>

          @if (order.createdAt) {
            <p class="go__time">{{ order.createdAt | date: 'shortTime' }}</p>
          }
        </article>
      } @empty {
        <p class="go__empty">
          {{
            tab === 'active' ? emptyActive : emptyHistory
          }}
        </p>
      }
    </div>
  `,
  styles: [
    `
      .go {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .go__banner {
        padding: 0.75rem 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
        background: color-mix(in srgb, var(--leos-warm-sand, #f7f3ee) 80%, #fff);
        color: var(--leos-ink, #1b2230);
      }
      .go__banner--warn {
        background: color-mix(in srgb, #b45309 12%, #fff);
      }
      .go__banner--ok {
        background: color-mix(in srgb, var(--studio-success, #4f8a6b) 14%, #fff);
        color: var(--studio-success, #4f8a6b);
        font-weight: 600;
      }
      .go__tabs {
        display: flex;
        gap: 0.5rem;
      }
      .go__tab {
        min-height: 2.75rem;
        padding: 0 1.1rem;
        border: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        border-radius: 999px;
        background: #fff;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 650;
        color: var(--leos-neutral-muted, #6b7280);
        cursor: pointer;
      }
      .go__tab--on {
        background: var(--leos-gold, #d7a14a);
        border-color: var(--leos-gold, #d7a14a);
        color: #fff;
      }
      .go__legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        font-size: 0.75rem;
        color: var(--leos-neutral-muted, #6b7280);
      }
      .go__leg {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }
      .go__dot {
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 999px;
        background: var(--leos-ink-muted, #8f96a3);
      }
      .go__dot--pending {
        background: var(--leos-ink-secondary, #6b7280);
      }
      .go__dot--prep {
        background: var(--leos-warning, #d9a441);
      }
      .go__dot--ready {
        background: var(--leos-success, #4f8a6b);
      }
      .go__dot--served {
        background: var(--leos-success, #4f8a6b);
      }
      .go__card {
        padding: 0.85rem 1rem;
        border-radius: 14px;
        border: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        background: color-mix(in srgb, var(--leos-warm-sand, #f7f3ee) 45%, #fff);
      }
      .go__card--ready {
        border-color: color-mix(in srgb, var(--leos-success, #4f8a6b) 45%, var(--leos-warm-sand-dark, #e7e2db));
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--leos-success, #4f8a6b) 18%, transparent);
      }
      .go__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }
      .go__num {
        font-weight: 650;
        font-size: 0.9375rem;
      }
      .go__chip {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 650;
        background: var(--leos-warm-sand-dark, #e7e2db);
        color: var(--leos-ink-body, #525866);
      }
      .go__chip--sm {
        font-size: 0.6875rem;
        padding: 0.15rem 0.45rem;
      }
      .go__chip[data-status='pending'],
      .go__chip[data-status='created'] {
        background: var(--leos-warm-sand-dark, #e7e2db);
        color: var(--leos-ink-body, #525866);
      }
      .go__chip[data-status='preparing'] {
        background: var(--leos-warning-bg, rgba(217, 164, 65, 0.14));
        color: var(--leos-gold-dark, #a96f20);
      }
      .go__chip[data-status='ready'] {
        background: var(--leos-success-bg, rgba(79, 138, 107, 0.12));
        color: var(--leos-success, #4f8a6b);
      }
      .go__chip[data-status='served'],
      .go__chip[data-status='delivered'],
      .go__chip[data-status='completed'] {
        background: var(--leos-success-bg, rgba(79, 138, 107, 0.12));
        color: var(--leos-success, #4f8a6b);
      }
      .go__chip[data-status='cancelled'] {
        background: var(--leos-danger-bg, rgba(198, 91, 82, 0.12));
        color: var(--leos-danger, #c65b52);
      }
      .go__ready {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 0.65rem;
        margin-bottom: 0.55rem;
        border-radius: 8px;
        background: var(--leos-success-bg, rgba(79, 138, 107, 0.12));
        color: var(--leos-success, #4f8a6b);
        font-size: 0.875rem;
        font-weight: 600;
      }
      .go__items {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .go__item {
        display: grid;
        grid-template-columns: 0.55rem 1fr auto;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
      }
      .go__item-dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 999px;
        background: var(--leos-ink-muted, #8f96a3);
      }
      .go__item-dot[data-status='preparing'] {
        background: var(--leos-warning, #d9a441);
      }
      .go__item-dot[data-status='ready'] {
        background: var(--leos-success, #4f8a6b);
      }
      .go__item-dot[data-status='served'],
      .go__item-dot[data-status='delivered'],
      .go__item-dot[data-status='completed'] {
        background: var(--leos-success, #4f8a6b);
      }
      .go__item-label {
        min-width: 0;
      }
      .go__time {
        margin: 0.55rem 0 0;
        font-size: 0.8rem;
        color: var(--leos-neutral-muted, #6b7280);
      }
      .go__empty {
        margin: 0.75rem 0 0;
        color: var(--leos-neutral-muted, #6b7280);
        font-size: 0.9rem;
      }
    `,
  ],
})
export class GuestOrdersComponent {
  @Input() orders: GuestOrder[] = [];
  @Input() readyHint = '';
  @Input() profileId = '';
  @Input() offlinePending = false;
  @Input() sending = false;
  @Input() recordedFlash = false;

  tab: OrdersTab = 'active';

  get legend() {
    return guestOrdersLegend(this.profileId);
  }

  get listAriaLabel(): string {
    const n = this.cardNoun;
    return /s$/i.test(n) ? n : `${n}s`;
  }

  get isHotel(): boolean {
    return (this.profileId || '').toLowerCase().includes('hotel');
  }

  get isFestival(): boolean {
    return (this.profileId || '').toLowerCase().includes('festival');
  }

  get isAirport(): boolean {
    return (this.profileId || '').toLowerCase().includes('airport');
  }

  get isHealthcare(): boolean {
    return (this.profileId || '').toLowerCase().includes('healthcare');
  }

  get cardNoun(): string {
    return this.isHotel || this.isHealthcare ? 'Request' : 'Order';
  }

  get recordedOkFlash(): string {
    return this.isHotel || this.isHealthcare
      ? 'Request received — the team can see it.'
      : 'Order received — the team can see it.';
  }

  get recordedPendingFlash(): string {
    return this.isHotel || this.isHealthcare
      ? 'Request saved — we’ll send it when you’re back online.'
      : 'Order saved — we’ll send it when you’re back online.';
  }

  get emptyActive(): string {
    if (this.isHotel) {
      return 'No active requests — choose something from Services when you’re ready.';
    }
    if (this.isHealthcare) {
      return 'No active requests — choose something from Amenities when you’re ready.';
    }
    if (this.isFestival) {
      return 'No active orders — grab something from Menu & merch when you’re ready.';
    }
    if (this.isAirport) {
      return 'No active orders — choose something from the Gate menu when you’re ready.';
    }
    return 'No active orders — place something from the menu when you’re ready.';
  }

  get emptyHistory(): string {
    if (this.isHotel) return 'Requests from this stay will show here.';
    if (this.isHealthcare) return 'Requests from this bay wait will show here.';
    if (this.isFestival) return 'Orders from this zone will show here.';
    if (this.isAirport) return 'Orders from this gate wait will show here.';
    return 'Orders from this visit will show here.';
  }

  get filtered(): GuestOrder[] {
    const list = this.orders.filter((o) => this.norm(o.status) !== 'cancelled');
    if (this.tab === 'active') {
      return list.filter((o) => !TERMINAL.has(this.norm(o.status)));
    }
    return list.filter((o) => TERMINAL.has(this.norm(o.status)));
  }

  norm(status: string): string {
    return (status || '').toLowerCase();
  }

  statusLabel(status: string): string {
    return guestStatusLabel(status, this.profileId);
  }

  shortId(id: string): string {
    if (!id) return '—';
    return id.length > 8 ? id.slice(-8) : id;
  }
}
