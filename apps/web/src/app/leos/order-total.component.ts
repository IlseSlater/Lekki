import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeosMoneyPipe } from './leos-money.pipe';

/** LEK-028 Order Total (Frozen). */
@Component({
  selector: 'leos-order-total',
  standalone: true,
  imports: [CommonModule, LeosMoneyPipe],
  template: `
    <p class="leos-order-total" aria-live="polite">
      <span class="leos-order-total__label">{{ label }}</span>
      <strong>{{ total | leosMoney: currency }}</strong>
    </p>
  `,
})
export class OrderTotalComponent {
  @Input() total = 0;
  @Input() currency = 'ZAR';
  @Input() label = 'Total';
}
