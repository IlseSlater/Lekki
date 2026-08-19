import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeosMoneyPipe } from './leos-money.pipe';

/** LEK-028 Payment Summary (Frozen) — amount due before settle. */
@Component({
  selector: 'leos-payment-summary',
  standalone: true,
  imports: [CommonModule, LeosMoneyPipe],
  template: `
    <div class="leos-payment-summary">
      <p class="leos-muted">{{ caption }}</p>
      <p class="leos-payment-summary__amount">
        <strong>{{ amount | leosMoney: currency }}</strong>
      </p>
      @if (trustLine) {
        <p class="leos-payment-summary__trust">{{ trustLine }}</p>
      }
      @if (methodHint) {
        <p class="leos-muted">{{ methodHint }}</p>
      }
    </div>
  `,
})
export class PaymentSummaryComponent {
  @Input() amount = 0;
  @Input() currency = 'ZAR';
  @Input() caption = 'Amount due';
  @Input() methodHint = '';
  @Input() trustLine = '';
}
