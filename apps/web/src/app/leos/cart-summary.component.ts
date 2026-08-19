import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeosMoneyPipe } from './leos-money.pipe';

/**
 * LEK-028 Cart Summary — floating “Your order” chip above guest tab bar.
 * Behaviour reference: dark-culinary floating cart chip; Lekki copy/theme.
 */
@Component({
  selector: 'leos-cart-summary',
  standalone: true,
  imports: [CommonModule, LeosMoneyPipe],
  template: `
    @if (count > 0) {
      <button
        type="button"
        class="leos-cart-chip"
        (click)="open.emit()"
        [attr.aria-label]="
          'Your ' + orderNoun + ', ' + count + (count === 1 ? ' item' : ' items') + ', ' + (total | leosMoney: currency)
        "
      >
        <span class="leos-cart-chip__count">{{ count }} {{ count === 1 ? 'item' : 'items' }}</span>
        <span class="leos-cart-chip__total">{{ total | leosMoney: currency }}</span>
        <span class="leos-cart-chip__cta">Your {{ orderNoun }}</span>
      </button>
    }
  `,
})
export class CartSummaryComponent {
  @Input() count = 0;
  @Input() total = 0;
  @Input() currency = 'ZAR';
  /** Pack transaction noun (order · request · …). */
  @Input() orderNoun = 'order';
  @Output() open = new EventEmitter<void>();
}
