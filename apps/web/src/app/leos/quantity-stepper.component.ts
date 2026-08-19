import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * LEK-028 Quantity Stepper (Frozen) — DoorDash-style pill:
 * [trash|−] · count · +
 * At qty 1 with allowRemove, left control removes the line.
 */
@Component({
  selector: 'leos-quantity-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="leos-qty" role="group" [attr.aria-label]="'Quantity for ' + label">
      @if (allowRemove && quantity <= min) {
        <button
          type="button"
          class="leos-qty__btn leos-qty__btn--remove"
          (click)="remove.emit()"
          [attr.aria-label]="'Remove ' + label"
        >
          <svg class="leos-qty__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"
            />
          </svg>
        </button>
      } @else {
        <button
          type="button"
          class="leos-qty__btn"
          (click)="change(-1)"
          [disabled]="quantity <= min && !allowRemove"
          [attr.aria-label]="'Decrease ' + label"
        >
          −
        </button>
      }
      <span class="leos-qty__value" aria-live="polite">{{ quantity }}</span>
      <button
        type="button"
        class="leos-qty__btn"
        (click)="change(1)"
        [disabled]="max != null && quantity >= max"
        [attr.aria-label]="'Increase ' + label"
      >
        +
      </button>
    </div>
  `,
})
export class QuantityStepperComponent {
  @Input() quantity = 1;
  @Input() min = 1;
  @Input() max: number | null = null;
  @Input() label = 'item';
  /** When true and qty is at min, left control removes the line (DoorDash cart). */
  @Input() allowRemove = false;
  @Output() quantityChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();

  change(delta: number) {
    const next = this.quantity + delta;
    if (next < this.min) {
      if (this.allowRemove) this.remove.emit();
      return;
    }
    if (this.max != null && next > this.max) return;
    if (next !== this.quantity) this.quantityChange.emit(next);
  }
}
