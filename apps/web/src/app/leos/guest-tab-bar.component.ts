import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TerminologyService } from '../services/terminology.service';

export type GuestTabId = 'menu' | 'orders' | 'bill';

/**
 * LEK-028 Guest Tab Bar — pack terminology for catalogue / payment chrome.
 */
@Component({
  selector: 'leos-guest-tab-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="leos-guest-tab-bar" aria-label="Guest navigation">
      <button
        type="button"
        class="leos-guest-tab-bar__item"
        [class.leos-guest-tab-bar__item--active]="active === 'menu'"
        (click)="tabSelect.emit('menu')"
      >
        <svg class="leos-guest-tab-bar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"
          />
        </svg>
        <span>{{ terms.term('catalogue', 'Menu') }}</span>
      </button>

      <button
        type="button"
        class="leos-guest-tab-bar__item"
        [class.leos-guest-tab-bar__item--active]="active === 'orders'"
        (click)="tabSelect.emit('orders')"
      >
        <svg class="leos-guest-tab-bar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M7 3h10a2 2 0 0 1 2 2v14l-7-3-7 3V5a2 2 0 0 1 2-2zm0 2v11.1l5-2.1 5 2.1V5H7z"
          />
        </svg>
        <span>{{ ordersLabel }}</span>
      </button>

      <button
        type="button"
        class="leos-guest-tab-bar__item"
        [class.leos-guest-tab-bar__item--active]="active === 'bill'"
        (click)="tabSelect.emit('bill')"
      >
        <svg class="leos-guest-tab-bar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M6 2h12a1 1 0 0 1 1 1v18l-3-1.5L13 21l-3-1.5L7 21l-2-1V3a1 1 0 0 1 1-1zm1 4v2h10V6H7zm0 4v2h10v-2H7zm0 4v2h6v-2H7z"
          />
        </svg>
        <span>{{ terms.term('payment', 'Bill') }}</span>
      </button>

      <button
        type="button"
        class="leos-guest-tab-bar__item"
        (click)="help.emit()"
        [attr.aria-label]="helpLabel"
      >
        <svg class="leos-guest-tab-bar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 2a8 8 0 0 0-8 8c0 2.5 1.2 4.7 3 6.1V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3.9c1.8-1.4 3-3.6 3-6.1a8 8 0 0 0-8-8zm-1 15h2v1h-2v-1zm1-12a5 5 0 0 1 5 5c0 1.8-.9 3.4-2.4 4.3L14 15h-4l-.6-.7A5 5 0 0 1 7 10a5 5 0 0 1 5-5z"
          />
        </svg>
        <span>{{ helpLabel }}</span>
      </button>

      <button
        type="button"
        class="leos-guest-tab-bar__item"
        [class.leos-guest-tab-bar__item--active]="leaveActive"
        (click)="leave.emit()"
        [attr.aria-label]="leaveLabel"
      >
        <svg class="leos-guest-tab-bar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M10 4v3H4v10h6v3l8-8-8-8zm2 2.8L16.2 12 12 17.2V15H6V9h6V6.8z"
          />
        </svg>
        <span>{{ leaveLabel }}</span>
      </button>
    </nav>
  `,
})
export class GuestTabBarComponent {
  readonly terms = inject(TerminologyService);

  /** Which route-tab is active (Help/Leave are actions). */
  @Input() active: GuestTabId = 'menu';
  @Input() leaveActive = false;
  @Output() tabSelect = new EventEmitter<GuestTabId>();
  @Output() help = new EventEmitter<void>();
  @Output() leave = new EventEmitter<void>();

  get ordersLabel(): string {
    const t = this.terms.term('transaction', 'Order');
    if (!t) return 'Orders';
    return /s$/i.test(t) ? t : `${t}s`;
  }

  get helpLabel(): string {
    return 'Help';
  }

  get leaveLabel(): string {
    const close = this.terms.term('close', 'Leave');
    if (/complete/i.test(close)) return 'Complete';
    if (/end/i.test(close) && /stay/i.test(close)) return 'End stay';
    if (/zone/i.test(close)) return 'Leave zone';
    if (/bay/i.test(close)) return 'Leave bay';
    if (/board/i.test(close)) return 'Leave';
    if (/clear/i.test(close)) return 'Leave';
    return 'Leave';
  }
}
