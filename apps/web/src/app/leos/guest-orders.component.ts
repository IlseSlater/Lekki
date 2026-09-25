import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { guestStatusLabel } from '../studio/operate-status';
import {
  calmOrderLineLabel,
  hasOrderHistory,
} from '../studio/order-state-calm';

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
 * Guest orders — living tab, not a status dashboard.
 * Open-tab Order-state calm: spoken status once · no legend · no gold filter pills.
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
          {{ offlinePending ? recordedPendingFlash : recordedOkFlash }}
        </div>
      }

      @if (showHistoryToggle) {
        <div class="go__filters" role="tablist" [attr.aria-label]="listAriaLabel">
          <button
            type="button"
            role="tab"
            class="go__filter"
            [class.go__filter--on]="tab === 'active'"
            [attr.aria-selected]="tab === 'active'"
            (click)="tab = 'active'"
          >
            Now
          </button>
          <button
            type="button"
            role="tab"
            class="go__filter"
            [class.go__filter--on]="tab === 'history'"
            [attr.aria-selected]="tab === 'history'"
            (click)="tab = 'history'"
          >
            Earlier
          </button>
        </div>
      }

      @for (order of filtered; track order.id) {
        <article class="go__card" [class.go__card--ready]="norm(order.status) === 'ready'">
          <header class="go__head">
            <p class="go__status" [attr.data-status]="norm(order.status)">
              {{ statusLabel(order.status) }}
            </p>
            @if (order.createdAt) {
              <p class="go__time">{{ order.createdAt | date: 'shortTime' }}</p>
            }
          </header>

          @if (norm(order.status) === 'ready') {
            <div class="go__ready" role="status">
              {{ readyHint || 'Your order is ready for you.' }}
            </div>
          }

          <ul class="go__items">
            @for (line of order.lines; track line.label + line.quantity) {
              <li class="go__item">{{ lineLabel(line) }}</li>
            }
          </ul>
        </article>
      } @empty {
        <p class="go__empty">
          {{ tab === 'active' ? emptyActive : emptyHistory }}
        </p>
      }
    </div>
  `,
  styles: [
    `
      .go {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .go__banner {
        padding: 0.75rem 1rem;
        border-radius: 12px;
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
      /* Filter chrome — ink, never gold (gold is Pay / Place only) */
      .go__filters {
        display: flex;
        gap: 0.35rem;
      }
      .go__filter {
        min-height: 2.25rem;
        padding: 0 0.9rem;
        border: none;
        border-radius: 999px;
        background: transparent;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 650;
        color: var(--leos-neutral-muted, #6b7280);
        cursor: pointer;
      }
      .go__filter--on {
        background: var(--leos-ink, #1b2230);
        color: #fff;
      }
      .go__card {
        padding: 1rem 1.1rem;
        border-radius: 1.25rem;
        border: none;
        background: color-mix(in srgb, var(--leos-warm-sand, #f7f3ee) 55%, #fff);
      }
      .go__card--ready {
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--leos-success, #4f8a6b) 28%, transparent);
      }
      .go__head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.75rem;
        margin-bottom: 0.45rem;
      }
      .go__status {
        margin: 0;
        font-family: var(--leos-font-display, Fraunces, Georgia, serif);
        font-size: 1.15rem;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: var(--leos-ink, #1b2230);
      }
      .go__status[data-status='ready'] {
        color: var(--leos-success, #4f8a6b);
      }
      .go__ready {
        padding: 0.55rem 0.65rem;
        margin-bottom: 0.55rem;
        border-radius: 10px;
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
        gap: 0.35rem;
      }
      .go__item {
        font-size: 0.9375rem;
        line-height: 1.4;
        color: var(--leos-ink-body, #525866);
      }
      .go__time {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 550;
        color: var(--leos-neutral-muted, #6b7280);
        flex-shrink: 0;
      }
      .go__empty {
        margin: 0.5rem 0 0;
        color: var(--leos-neutral-muted, #6b7280);
        font-size: 0.9375rem;
        line-height: 1.45;
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

  get showHistoryToggle(): boolean {
    return hasOrderHistory(this.orders.map((o) => o.status));
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
      return 'Nothing in progress — choose something from Services when you’re ready.';
    }
    if (this.isHealthcare) {
      return 'Nothing in progress — choose something from Amenities when you’re ready.';
    }
    if (this.isFestival) {
      return 'Nothing in progress — grab something from the menu when you’re ready.';
    }
    if (this.isAirport) {
      return 'Nothing in progress — choose something from the Gate menu when you’re ready.';
    }
    return 'Nothing in progress — place something from the menu when you’re ready.';
  }

  get emptyHistory(): string {
    if (this.isHotel) return 'Earlier requests from this stay will show here.';
    if (this.isHealthcare) return 'Earlier requests from this bay wait will show here.';
    if (this.isFestival) return 'Earlier orders from this zone will show here.';
    if (this.isAirport) return 'Earlier orders from this gate wait will show here.';
    return 'Earlier orders from this visit will show here.';
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

  lineLabel(line: GuestOrderLine): string {
    return calmOrderLineLabel(line.label, line.quantity);
  }
}
