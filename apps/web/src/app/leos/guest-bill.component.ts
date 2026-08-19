import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeosMoneyPipe } from './leos-money.pipe';

export type BillLine = {
  label: string;
  quantity: number;
  total: number;
};

  /** One open transaction line — for See → Claim → Confirm (ids preserved). */
export type BillDisplayLine = BillLine & {
  id: string;
  mine: boolean;
  ownerParticipantId?: string | null;
  /** First name of whoever owns this line (for live chips). */
  ownerName?: string;
};

export type BillScope = 'visit' | 'mine' | 'equal';

const TIP_OPTIONS = [0, 10, 15, 18, 20];

/**
 * Guest bill — ported from Restaurant App bill.page functionality.
 * LEOS hospitality chrome (no Material / dark ops).
 */
@Component({
  selector: 'leos-guest-bill',
  standalone: true,
  imports: [CommonModule, FormsModule, LeosMoneyPipe],
  template: `
    <div class="gb">
      @if (showScope) {
        <div class="gb__scope" role="tablist" aria-label="Bill scope">
          <button
            type="button"
            role="tab"
            class="gb__scope-btn"
            [class.gb__scope-btn--on]="scope === 'visit'"
            [attr.aria-selected]="scope === 'visit'"
            (click)="setScope('visit')"
          >
            {{ visitLabel }}
            <span class="gb__scope-amt">({{ visitSubtotal | leosMoney: currency }})</span>
          </button>
          <button
            type="button"
            role="tab"
            class="gb__scope-btn"
            [class.gb__scope-btn--on]="scope === 'mine'"
            [class.gb__scope-btn--done]="mineSharePaid"
            [class.gb__scope-btn--pulse]="mineScopePulse"
            [attr.aria-selected]="scope === 'mine'"
            [disabled]="mineSharePaid && visitSubtotal > 0.001"
            (click)="setScope('mine')"
          >
            {{ mineSharePaid ? 'Mine · paid' : 'Mine' }}
            <span class="gb__scope-amt">({{ mineSubtotal | leosMoney: currency }})</span>
          </button>
          @if (showEqualShare) {
            <button
              type="button"
              role="tab"
              class="gb__scope-btn"
              [class.gb__scope-btn--on]="scope === 'equal'"
              [class.gb__scope-btn--done]="equalSharePaid"
              [attr.aria-selected]="scope === 'equal'"
              [disabled]="equalSharePaid && visitSubtotal > 0.001"
              (click)="setScope('equal')"
            >
              {{ equalSharePaid ? 'Equal · paid' : 'Equal share' }}
              <span class="gb__scope-amt">({{ equalSubtotal | leosMoney: currency }})</span>
            </button>
          }
        </div>
        @if (mineSharePaid && visitSubtotal > 0.001 && scope !== 'equal') {
          <p class="gb__share-note">Your share is paid — you can still cover the visit if you like.</p>
        }
        @if (equalSharePaid && visitSubtotal > 0.001) {
          <p class="gb__share-note">Your equal share is paid — others can settle the rest, or you can cover the visit.</p>
        }
      }

      <div class="gb__lines" aria-label="Bill items">
        @for (line of displayLines; track line.id || line.label + line.quantity) {
          <div
            class="gb__line"
            [class.gb__line--claimable]="canClaimLine(line)"
            [class.gb__line--just-claimed]="isJustClaimed(line.id)"
          >
            <span class="gb__line-main">
              <span>{{ line.label }} × {{ line.quantity }}</span>
              @if (scope === 'visit') {
                @if (line.mine) {
                  <span class="gb__yours" [class.gb__yours--flash]="isJustClaimed(line.id)">✓ Yours</span>
                } @else if (line.ownerName) {
                  <span class="gb__owner-chip">Claimed by {{ line.ownerName }}</span>
                } @else if (canClaimLine(line)) {
                  <button
                    type="button"
                    class="gb__claim"
                    [disabled]="busy || offline || claimingLineId === line.id"
                    (click)="claimLine.emit(line.id)"
                  >
                    {{ claimingLineId === line.id ? 'Claiming…' : 'Claim' }}
                  </button>
                }
              }
            </span>
            <span>{{ line.total | leosMoney: currency }}</span>
          </div>
        } @empty {
          <p class="gb__empty">Nothing on your bill yet.</p>
        }
      </div>

      @if (showUnclaimedHint) {
        <p class="gb__claim-hint">Tap Claim on anything that’s yours — then pay your share.</p>
      }

      @if (allowTip) {
        <div class="gb__tip">
          <span class="gb__tip-label">Service / Tip</span>
          <div class="gb__chips">
            @for (pct of tipOptions; track pct) {
              <button
                type="button"
                class="gb__chip"
                [class.gb__chip--on]="!customTip && tipPercent === pct"
                (click)="setTipPercent(pct)"
              >
                {{ pct }}%
              </button>
            }
            <button
              type="button"
              class="gb__chip gb__chip--edit"
              [class.gb__chip--on]="customTip"
              (click)="enableCustomTip()"
              aria-label="Custom tip"
            >
              Edit
            </button>
          </div>
          @if (customTip) {
            <label class="gb__custom">
              <span class="gb__tip-label">Tip amount</span>
              <input
                class="leos-field__input"
                type="number"
                min="0"
                step="0.01"
                [ngModel]="customTipAmount"
                (ngModelChange)="onCustomTip($event)"
                placeholder="0.00"
              />
            </label>
          }
        </div>
      }

      <div class="gb__summary">
        <div class="gb__row"><span>Subtotal</span><span>{{ subtotal | leosMoney: currency }}</span></div>
        @if (allowTip) {
          <div class="gb__row">
            <span>Service fee / tip</span><span>{{ tipAmount | leosMoney: currency }}</span>
          </div>
        }
        <div class="gb__row gb__row--total">
          <span>Total</span><span>{{ total | leosMoney: currency }}</span>
        </div>
      </div>

      @if (trustLine) {
        <p class="gb__trust">{{ trustLine }}</p>
      }
      @if (savedPaymentMethodStatus !== 'none') {
        <div class="gb__payment-method">
          <span class="gb__payment-method-label">Payment method</span>
          <button
            type="button"
            class="gb__payment-method-link"
            (click)="openPaymentMethods.emit()"
          >
            <span class="gb__payment-method-value">
              {{
                savedPaymentMethodStatus === 'locked'
                  ? paymentMethodLabel || 'Card · remembered'
                  : paymentMethodLabel || 'Card'
              }}
            </span>
            <span class="gb__payment-method-edit">Change</span>
          </button>
        </div>
      } @else {
        <div class="gb__payment-method">
          <span class="gb__payment-method-label">Payment method</span>
          <button
            type="button"
            class="leos-btn leos-btn--secondary gb__payment-method-cta"
            (click)="openPaymentMethods.emit()"
          >
            Choose how to pay
          </button>
        </div>
      }
      @if (error) {
        <p class="leos-error-banner" role="alert">{{ error }}</p>
      }
      @if (busy) {
        <p class="leos-success-banner" role="status">Securing your payment…</p>
      }

      <div class="gb__actions">
        <button
          type="button"
          class="leos-btn leos-btn--primary"
          [disabled]="busy || offline || subtotal <= 0"
          (click)="pay.emit()"
        >
          {{ busy ? 'Securing…' : error ? 'Try again' : 'Pay ' + (total | leosMoney: currency) }}
        </button>
        <div class="gb__help-actions">
          <button type="button" class="leos-btn leos-btn--secondary" (click)="serviceHelp.emit()">
            {{ serviceHelpLabel }}
          </button>
          <button type="button" class="leos-btn leos-btn--secondary" (click)="managerHelp.emit()">
            {{ managerHelpLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .gb {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .gb__scope {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .gb__scope-btn {
        flex: 1 1 calc(33.33% - 0.35rem);
        min-width: 5.5rem;
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        min-height: 2.75rem;
        padding: 0.55rem 0.65rem;
        border-radius: 10px;
        border: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        background: color-mix(in srgb, var(--leos-warm-sand, #f7f3ee) 70%, #fff);
        color: var(--leos-neutral-muted, #6b7280);
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
      }
      .gb__scope-btn--on {
        background: var(--leos-gold, #d7a14a);
        color: #fff;
        border-color: var(--leos-gold, #d7a14a);
      }
      .gb__scope-btn--pulse {
        animation: gb-mine-pulse 220ms cubic-bezier(0.33, 1, 0.68, 1);
      }
      @keyframes gb-mine-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(79, 138, 107, 0.45);
        }
        100% {
          box-shadow: 0 0 0 8px rgba(79, 138, 107, 0);
        }
      }
      .gb__scope-btn--done:not(.gb__scope-btn--on) {
        opacity: 0.72;
      }
      .gb__scope-btn:disabled {
        cursor: default;
      }
      .gb__share-note {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--leos-neutral-muted, #6b7280);
        line-height: 1.4;
      }
      .gb__scope-amt {
        font-weight: 500;
        font-size: 0.8125rem;
        opacity: 0.9;
      }
      .gb__lines {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .gb__line {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        padding: 0.4rem 0;
        border-bottom: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        font-size: 0.9375rem;
      }
      .gb__line-main {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
        min-width: 0;
      }
      .gb__claim {
        border: none;
        background: transparent;
        padding: 0;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--leos-gold, #d7a14a);
        cursor: pointer;
        min-height: 2.75rem;
      }
      .gb__claim:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .gb__claim-hint {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--leos-neutral-muted, #6b7280);
        line-height: 1.4;
      }
      .gb__yours {
        font-size: 0.8125rem;
        font-weight: 650;
        color: #4f8a6b;
      }
      .gb__yours--flash {
        animation: gb-yours-flash 220ms cubic-bezier(0.33, 1, 0.68, 1);
      }
      @keyframes gb-yours-flash {
        from {
          opacity: 0.35;
          transform: scale(0.96);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .gb__line--just-claimed {
        background: color-mix(in srgb, #4f8a6b 6%, transparent);
        border-radius: 8px;
        margin: 0 -0.25rem;
        padding-left: 0.25rem;
        padding-right: 0.25rem;
      }
      .gb__owner-chip {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--leos-neutral-muted, #6b7280);
      }
      .gb__empty {
        margin: 0;
        color: var(--leos-neutral-muted, #6b7280);
        font-size: 0.9rem;
      }
      .gb__tip-label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--leos-neutral-muted, #6b7280);
        margin-bottom: 0.45rem;
      }
      .gb__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .gb__chip {
        min-height: 2.75rem;
        min-width: 2.75rem;
        padding: 0.35rem 0.75rem;
        border-radius: 8px;
        border: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        background: #fff;
        color: var(--leos-ink, #1b2230);
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
      }
      .gb__chip--on {
        background: var(--leos-gold, #d7a14a);
        border-color: var(--leos-gold, #d7a14a);
        color: #1b2230;
      }
      .gb__custom {
        display: block;
        margin-top: 0.65rem;
        max-width: 10rem;
      }
      .gb__summary {
        margin-top: 0.25rem;
        padding: 1rem;
        border-radius: 12px;
        border: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        background: color-mix(in srgb, var(--leos-warm-sand, #f7f3ee) 55%, #fff);
      }
      .gb__row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.45rem;
        font-size: 0.9375rem;
      }
      .gb__row--total {
        font-size: 1.2rem;
        font-weight: 650;
        margin-top: 0.35rem;
        margin-bottom: 0;
      }
      .gb__trust {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--leos-neutral-muted, #6b7280);
      }
      .gb__payment-method {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.65rem 0.85rem;
        border-radius: 12px;
        border: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        background: color-mix(in srgb, var(--leos-warm-sand, #f7f3ee) 55%, #fff);
      }
      .gb__payment-method-label {
        font-size: 0.8125rem;
        font-weight: 650;
        color: var(--leos-neutral-muted, #6b7280);
      }
      .gb__payment-method-value {
        font-size: 0.9rem;
        font-weight: 650;
        color: var(--leos-ink, #1b2230);
      }
      .gb__payment-method-link {
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        font: inherit;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
        text-align: right;
        min-height: 2.75rem;
      }
      .gb__payment-method-edit {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--leos-gold, #d7a14a);
      }
      .gb__payment-method-cta {
        width: auto;
        padding: 0.55rem 0.9rem;
      }
      .gb__actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.35rem;
      }
      .gb__help-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
      }
      .gb__actions .leos-btn {
        width: 100%;
      }
    `,
  ],
})
export class GuestBillComponent {
  @Input() lines: BillLine[] = [];
  @Input() mineLines: BillLine[] | null = null;
  /** Per-line visit rows (multi-guest claim). When set, bill lists these instead of aggregated labels. */
  @Input() detailLines: BillDisplayLine[] | null = null;
  @Input() claimingLineId: string | null = null;
  @Input() recentlyClaimedIds: string[] = [];
  @Input() mineScopePulse = false;
  /** Remaining visit balance after completed payments (null = use line totals). */
  @Input() visitRemaining: number | null = null;
  /** Remaining mine share after this guest’s mine payments (null = use mine line totals). */
  @Input() mineRemaining: number | null = null;
  /** Remaining equal share for this guest (null = hide Equal share). */
  @Input() equalRemaining: number | null = null;
  @Input() currency = 'ZAR';
  @Input() visitLabel = 'This visit';
  @Input() showScope = true;
  @Input() allowTip = true;
  @Input() trustLine = 'Nothing is charged until you confirm.';
  @Input() savedPaymentMethodStatus: 'none' | 'locked' | 'ready' = 'none';
  /** Visit-scoped display label from payment methods panel (e.g. Card · •••• 4242). */
  @Input() paymentMethodLabel = 'Card';
  @Input() serviceHelpLabel = 'Request waiter';
  @Input() managerHelpLabel = 'Speak to the manager';
  @Input() busy = false;
  @Input() offline = false;
  @Input() error = '';

  @Output() pay = new EventEmitter<void>();
  @Output() serviceHelp = new EventEmitter<void>();
  @Output() managerHelp = new EventEmitter<void>();
  @Output() claimLine = new EventEmitter<string>();
  @Output() openPaymentMethods = new EventEmitter<void>();
  @Output() totalChange = new EventEmitter<number>();
  @Output() tipChange = new EventEmitter<number>();
  @Output() scopeChange = new EventEmitter<BillScope>();

  readonly tipOptions = TIP_OPTIONS;
  scope: BillScope = 'visit';
  tipPercent = 0;
  customTip = false;
  customTipAmount = 0;

  get showEqualShare(): boolean {
    return this.equalRemaining != null && this.visitSubtotal > 0.001;
  }

  get showUnclaimedHint(): boolean {
    return this.scope === 'visit' && !!this.detailLines?.some((l) => this.canClaimLine(l));
  }

  canClaimLine(line: BillDisplayLine): boolean {
    return (
      this.scope === 'visit' &&
      !!line.id &&
      !line.mine &&
      !line.ownerName
    );
  }

  isJustClaimed(lineId: string): boolean {
    return this.recentlyClaimedIds.includes(lineId);
  }

  get displayLines(): BillDisplayLine[] {
    if (this.scope === 'equal') {
      return [
        {
          id: 'equal',
          label: 'Equal share of visit',
          quantity: 1,
          total: this.equalSubtotal,
          mine: true,
        },
      ];
    }
    if (this.detailLines?.length) {
      return this.scope === 'mine'
        ? this.detailLines.filter((l) => l.mine)
        : this.detailLines;
    }
    const base = this.scope === 'mine' && this.mineLines ? this.mineLines : this.lines;
    return base.map((l, i) => ({
      ...l,
      id: `agg-${i}`,
      mine: this.scope === 'mine',
    }));
  }

  get activeLines(): BillLine[] {
    return this.displayLines;
  }

  get visitSubtotal(): number {
    if (this.visitRemaining != null) return Math.max(0, this.visitRemaining);
    return this.sum(this.lines);
  }

  get mineSubtotal(): number {
    if (this.mineRemaining != null) return Math.max(0, this.mineRemaining);
    return this.sum(this.mineLines ?? this.lines);
  }

  get equalSubtotal(): number {
    if (this.equalRemaining != null) return Math.max(0, this.equalRemaining);
    return 0;
  }

  get mineSharePaid(): boolean {
    return this.mineSubtotal <= 0.001 && this.sum(this.mineLines ?? []) > 0.001;
  }

  get equalSharePaid(): boolean {
    return this.showEqualShare && this.equalSubtotal <= 0.001;
  }

  get subtotal(): number {
    if (this.scope === 'mine') return this.mineSubtotal;
    if (this.scope === 'equal') return this.equalSubtotal;
    return this.visitSubtotal;
  }

  get tipAmount(): number {
    if (!this.allowTip) return 0;
    if (this.customTip) return Math.max(0, this.customTipAmount);
    return Math.round(((this.subtotal * this.tipPercent) / 100) * 100) / 100;
  }

  get total(): number {
    return Math.round((this.subtotal + this.tipAmount) * 100) / 100;
  }

  setScope(scope: BillScope) {
    if (scope === 'mine' && this.mineSharePaid && this.visitSubtotal > 0.001) return;
    if (scope === 'equal' && this.equalSharePaid && this.visitSubtotal > 0.001) return;
    if (scope === 'equal' && !this.showEqualShare) return;
    this.scope = scope;
    this.scopeChange.emit(scope);
    this.emitMoney();
  }

  setTipPercent(pct: number) {
    this.customTip = false;
    this.tipPercent = pct;
    this.emitMoney();
  }

  enableCustomTip() {
    this.customTip = true;
    this.emitMoney();
  }

  onCustomTip(value: number | string) {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    this.customTipAmount = Number.isFinite(n) && n >= 0 ? n : 0;
    this.emitMoney();
  }

  private sum(lines: BillLine[]): number {
    return Math.round(lines.reduce((n, l) => n + (Number(l.total) || 0), 0) * 100) / 100;
  }

  private emitMoney() {
    this.tipChange.emit(this.tipAmount);
    this.totalChange.emit(this.total);
  }
}
