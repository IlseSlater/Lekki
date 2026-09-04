import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TerminologyService } from '../services/terminology.service';

export type GuestTabId = 'specials' | 'menu' | 'orders' | 'bill';

/**
 * LEK-028 Guest Tab Bar — max 4 route tabs; Help lives in overflow.
 * Leave is on the receipt screen, not the dock.
 */
@Component({
  selector: 'leos-guest-tab-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="leos-guest-tab-bar" aria-label="Guest navigation">
      @if (showSpecials) {
        <button
          type="button"
          class="leos-guest-tab-bar__item"
          [class.leos-guest-tab-bar__item--active]="active === 'specials'"
          (click)="tabSelect.emit('specials')"
        >
          <svg class="leos-guest-tab-bar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.1L12 16.8 5.7 20.7 8 13.6 2 9.2h7.6L12 2z"
            />
          </svg>
          <span>Specials</span>
        </button>
      }

      <button
        type="button"
        class="leos-guest-tab-bar__item"
        [class.leos-guest-tab-bar__item--active]="active === 'menu'"
        (click)="tabSelect.emit('menu')"
      >
        <svg class="leos-guest-tab-bar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" />
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

      @if (showPay) {
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
      }

      @if (showHelp) {
        <button
          type="button"
          class="leos-guest-tab-bar__item leos-guest-tab-bar__item--overflow"
          (click)="help.emit()"
          [attr.aria-label]="helpLabel"
        >
          <svg class="leos-guest-tab-bar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M6 10a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm8 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM6 16a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm8 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"
            />
          </svg>
          <span>More</span>
        </button>
      }
    </nav>
  `,
})
export class GuestTabBarComponent {
  readonly terms = inject(TerminologyService);

  @Input() active: GuestTabId = 'menu';
  /** Studio guestDesign.specials — Specials page on/off. */
  @Input() showSpecials = false;
  /** Studio guestDesign.payAtTable — Bill / Pay on/off. */
  @Input() showPay = true;
  /** Studio guestDesign.callStaff — Help in overflow. */
  @Input() showHelp = true;
  @Output() tabSelect = new EventEmitter<GuestTabId>();
  @Output() help = new EventEmitter<void>();

  get ordersLabel(): string {
    const t = this.terms.term('transaction', 'Order');
    if (!t) return 'Orders';
    return /s$/i.test(t) ? t : `${t}s`;
  }

  get helpLabel(): string {
    return 'Help and more';
  }
}
