import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LineItemRowComponent } from '../leos/line-item-row.component';
import { OrderTotalComponent } from '../leos/order-total.component';
import {
  GuestBillComponent,
  type BillDisplayLine,
  type BillLine,
} from '../leos/guest-bill.component';
import { LeosMoneyPipe } from '../leos/leos-money.pipe';
import type { CartLine } from '../services/guest-session.service';

/** Presentation phases — mapped from GuestSessionService.phase by the smart container. */
export type GuestCartDrawerPhase = 'draft' | 'ordered' | 'paying';

export type GuestCartClaimUndo = {
  lineId: string;
  label: string;
};

/**
 * Dumb cart / bill surface — draft cart lines or live bill / split / claim.
 * Composes existing LEK-028 line rows + GuestBill; never injects GuestSessionService.
 */
@Component({
  selector: 'lekki-guest-cart-drawer',
  standalone: true,
  imports: [
    CommonModule,
    LineItemRowComponent,
    OrderTotalComponent,
    GuestBillComponent,
    LeosMoneyPipe,
  ],
  template: `
    @if (cartPhase === 'draft') {
      @if (!cartLines.length) {
        <div class="leos-empty">
          <p class="leos-muted">Your {{ orderNoun }} is empty.</p>
          <p class="leos-muted">
            Pick something from the {{ catalogueNoun }} — it only takes a tap.
          </p>
        </div>
      } @else {
        <h2 class="leos-cart-heading">Your {{ orderNoun }}</h2>
        <div
          class="leos-cart-lines"
          role="list"
          [attr.aria-label]="'Your ' + orderNoun"
        >
          @for (line of cartLines; track $index) {
            <leos-line-item-row
              [label]="line.label"
              [choiceSummary]="line.choiceSummary || null"
              [imageUrl]="line.imageUrl || null"
              [quantity]="line.quantity"
              [unitPrice]="line.unitPrice"
              [editable]="true"
              [showEdit]="!!line.selections"
              (quantityChange)="updateCartQty.emit({ index: $index, quantity: $event })"
              (remove)="removeCartLine.emit($index)"
              (edit)="editCartLine.emit($index)"
            />
          }
        </div>
        <leos-order-total [total]="cartTotal" label="Total" />
      }
    }

    @if (cartPhase === 'paying') {
      @if (offline) {
        <div class="leos-offline-banner" role="status">You’re offline — pay when you’re back online.</div>
      }
      @if (shareSettledMoment) {
        <div class="leos-leave-moment" role="status">
          <p class="leos-leave-moment__title">Equal share is paid</p>
          <p class="leos-leave-moment__thanks">
            Thanks — you’re settled for your part.
            @if (visitHasOpenBalance) {
              The rest of the visit can stay open for others, or you can cover it if you like.
            }
          </p>
          @if (visitHasOpenBalance) {
            <p class="leos-muted" style="margin-top:0.75rem;">
              Visit still open: {{ visitRemaining | leosMoney: 'ZAR' }}
            </p>
          }
        </div>
      } @else {
        <leos-guest-bill
          #bill
          [lines]="billLines"
          [mineLines]="mineBillLines"
          [detailLines]="detailLines"
          [claimingLineId]="claimingLineId"
          [recentlyClaimedIds]="recentlyClaimedIds"
          [mineScopePulse]="mineScopePulse"
          [visitRemaining]="visitRemaining"
          [mineRemaining]="mineRemaining"
          [equalRemaining]="equalRemaining"
          [visitLabel]="visitLabel"
          [showScope]="true"
          [allowTip]="allowTip"
          [allowHelp]="allowHelp"
          [trustLine]="trustLine"
          [savedPaymentMethodStatus]="savedPaymentMethodStatus"
          [paymentMethodLabel]="paymentMethodLabel"
          [serviceHelpLabel]="serviceHelpLabel"
          [managerHelpLabel]="managerHelpLabel"
          [busy]="paying"
          [offline]="offline"
          [error]="paymentError"
          (pay)="initiatePayment.emit()"
          (serviceHelp)="serviceHelp.emit()"
          (managerHelp)="managerHelp.emit()"
          (claimLine)="claimLine.emit($event)"
        />

        @if (claimUndo) {
          <div class="leos-claim-undo" role="status" aria-live="polite">
            <span>{{ claimUndo.label }} added to your share.</span>
            <button type="button" class="leos-claim-undo__action" (click)="unclaimLine.emit()">
              Undo
            </button>
          </div>
        }
      }
    }
  `,
})
export class GuestCartDrawerComponent {
  @Input({ required: true }) cartPhase!: GuestCartDrawerPhase;

  /** Draft cart */
  @Input() cartLines: CartLine[] = [];
  @Input() cartTotal = 0;
  @Input() orderNoun = 'order';
  @Input() catalogueNoun = 'menu';

  /** Paying / split bill — projected from session */
  @Input() billLines: BillLine[] = [];
  @Input() mineBillLines: BillLine[] = [];
  @Input() detailLines: BillDisplayLine[] | null = null;
  @Input() claimingLineId: string | null = null;
  @Input() recentlyClaimedIds: string[] = [];
  @Input() mineScopePulse = false;
  @Input() visitRemaining: number | null = null;
  @Input() mineRemaining: number | null = null;
  @Input() equalRemaining: number | null = null;
  @Input() visitLabel = 'This visit';
  @Input() allowTip = true;
  @Input() allowHelp = true;
  @Input() trustLine = 'Nothing is charged until you confirm.';
  @Input() savedPaymentMethodStatus: 'none' | 'locked' | 'ready' = 'none';
  @Input() paymentMethodLabel = 'Card';
  @Input() serviceHelpLabel = 'Request waiter';
  @Input() managerHelpLabel = 'Speak to the manager';
  @Input() paying = false;
  @Input() offline = false;
  @Input() paymentError = '';
  @Input() claimUndo: GuestCartClaimUndo | null = null;
  @Input() shareSettledMoment = false;
  @Input() visitHasOpenBalance = false;

  @Output() updateCartQty = new EventEmitter<{ index: number; quantity: number }>();
  @Output() removeCartLine = new EventEmitter<number>();
  @Output() editCartLine = new EventEmitter<number>();
  @Output() claimLine = new EventEmitter<string>();
  @Output() unclaimLine = new EventEmitter<void>();
  @Output() initiatePayment = new EventEmitter<void>();
  @Output() serviceHelp = new EventEmitter<void>();
  @Output() managerHelp = new EventEmitter<void>();
  /** Forwards GuestBill instance so the session can read tip/scope at pay time. */
  @Output() billAttached = new EventEmitter<GuestBillComponent | undefined>();

  @ViewChild('bill')
  set billRef(bill: GuestBillComponent | undefined) {
    this.billAttached.emit(bill);
  }
}
