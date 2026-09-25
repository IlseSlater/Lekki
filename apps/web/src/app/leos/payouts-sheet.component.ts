import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Payouts sheet — Grow's "door" pattern.
 * Reference implementation: S-16-19 reuse this exact shape, not their own.
 */
@Component({
  selector: 'leos-payouts-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="leos-payouts-sheet" role="dialog" aria-modal="true" aria-labelledby="payouts-sheet-title">
        <button
          type="button"
          class="leos-payouts-sheet__backdrop"
          aria-label="Close payouts"
          (click)="dismiss.emit()"
        ></button>
        <div class="leos-payouts-sheet__panel">
          <h2 id="payouts-sheet-title" class="leos-payouts-sheet__title">What you've taken</h2>

          @if (loading) {
            <p class="leos-payouts-sheet__line">Gathering your totals…</p>
          } @else if (error) {
            <p class="leos-payouts-sheet__line" role="alert">{{ error }}</p>
          } @else {
            <p class="leos-payouts-sheet__line leos-payouts-sheet__line--total">{{ totalLine }}</p>
            <p class="leos-payouts-sheet__line leos-payouts-sheet__line--cadence">{{ cadenceLine }}</p>
          }

          <button type="button" class="leos-payouts-sheet__cancel" (click)="dismiss.emit()">
            Close
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .leos-payouts-sheet {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .leos-payouts-sheet__backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(40, 28, 18, 0.35);
        cursor: pointer;
      }
      .leos-payouts-sheet__panel {
        position: relative;
        width: min(28rem, 100%);
        padding: 1.25rem 1.25rem 1.75rem;
        border-radius: 1.25rem 1.25rem 0 0;
        background: var(--leos-surface, #f7f1e8);
        box-shadow: 0 -8px 32px rgba(40, 28, 18, 0.12);
        animation: leos-payouts-up 0.28s ease-out;
      }
      @keyframes leos-payouts-up {
        from {
          transform: translateY(1rem);
          opacity: 0.6;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .leos-payouts-sheet__title {
        margin: 0 0 0.75rem;
        font-family: var(--leos-font-display, Fraunces, Georgia, serif);
        font-size: 1.35rem;
        font-weight: 600;
        color: var(--leos-ink, #2a2118);
      }
      .leos-payouts-sheet__line {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        color: var(--leos-ink, #2a2118);
      }
      .leos-payouts-sheet__line--total {
        font-weight: 600;
      }
      .leos-payouts-sheet__line--cadence {
        color: var(--leos-muted, #6b5c4d);
        font-size: 0.9rem;
      }
      .leos-payouts-sheet__cancel {
        display: block;
        width: 100%;
        margin-top: 0.75rem;
        padding: 0.75rem;
        border: 0;
        background: transparent;
        color: var(--leos-muted, #6b5c4d);
        font-size: 0.95rem;
        cursor: pointer;
        min-height: 44px;
      }
    `,
  ],
})
export class PayoutsSheetComponent {
  @Input() open = false;
  @Input() loading = false;
  @Input() error = '';
  @Input() totalLine = '';
  @Input() cadenceLine = '';
  @Output() dismiss = new EventEmitter<void>();
}
