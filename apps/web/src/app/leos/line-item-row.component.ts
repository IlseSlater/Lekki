import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuantityStepperComponent } from './quantity-stepper.component';
import { LeosMoneyPipe } from './leos-money.pipe';
import { safeGuestImageUrl } from './catalogue-parity';

/**
 * LEK-028 Line Item Row (Frozen) — DoorDash cart anatomy:
 * thumb · name / choice / price · qty pill (trash | n | +)
 */
@Component({
  selector: 'leos-line-item-row',
  standalone: true,
  imports: [CommonModule, LeosMoneyPipe, QuantityStepperComponent],
  template: `
    <div class="leos-line-item" role="listitem">
      @if (safeImageUrl) {
        <img class="leos-line-item__thumb" [src]="safeImageUrl" [alt]="" width="56" height="56" />
      } @else if (editable) {
        <div class="leos-line-item__thumb leos-line-item__thumb--placeholder" aria-hidden="true"></div>
      }

      <div class="leos-line-item__main">
        <strong class="leos-line-item__name">{{ label }}</strong>
        @if (choiceSummary) {
          <div class="leos-line-item__choice">{{ choiceSummary }}</div>
        }
        @if (editable && showEdit) {
          <button type="button" class="leos-line-item__edit" (click)="edit.emit()">Edit</button>
        }
        @if (editable) {
          <div class="leos-line-item__price">{{ unitPrice | leosMoney: currency }}</div>
        } @else {
          <div class="leos-muted">× {{ quantity }} · {{ lineTotal | leosMoney: currency }}</div>
        }
      </div>

      @if (editable) {
        <leos-quantity-stepper
          [quantity]="quantity"
          [label]="label"
          [allowRemove]="true"
          (quantityChange)="quantityChange.emit($event)"
          (remove)="remove.emit()"
        />
      }
    </div>
  `,
})
export class LineItemRowComponent {
  @Input({ required: true }) label = '';
  @Input() quantity = 1;
  @Input() unitPrice = 0;
  @Input() currency = 'ZAR';
  @Input() editable = false;
  /** Optional product thumbnail (DoorDash left column). */
  @Input() imageUrl: string | null = null;
  /** Choice / modifier summary under the name (e.g. “Lime”). */
  @Input() choiceSummary: string | null = null;
  @Input() showEdit = false;
  @Output() quantityChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();

  get safeImageUrl(): string | null {
    return safeGuestImageUrl(this.imageUrl);
  }

  get lineTotal(): number {
    return this.quantity * this.unitPrice;
  }
}
