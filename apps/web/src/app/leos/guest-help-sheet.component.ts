import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GuestHelpKind = 'service' | 'manager';

/**
 * Guest help sheet — dual assistance (Waiter vs Manager).
 * LEOS visual language; Restaurant App behaviour reference only.
 */
@Component({
  selector: 'leos-guest-help-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="leos-help-sheet" role="dialog" aria-modal="true" aria-labelledby="help-sheet-title">
        <button
          type="button"
          class="leos-help-sheet__backdrop"
          aria-label="Close help"
          (click)="dismiss.emit()"
        ></button>
        <div class="leos-help-sheet__panel">
          <h2 id="help-sheet-title" class="leos-help-sheet__title">How can we help?</h2>
          <p class="leos-help-sheet__blurb">Choose who you’d like to speak with.</p>

          <button
            type="button"
            class="leos-help-sheet__action"
            [disabled]="busy || servicePending"
            (click)="choose.emit('service')"
          >
            <span class="leos-help-sheet__action-label">{{ serviceLabel }}</span>
            <span class="leos-help-sheet__action-hint">
              {{ servicePending ? servicePendingHint : serviceIdleHint }}
            </span>
          </button>

          <button
            type="button"
            class="leos-help-sheet__action leos-help-sheet__action--manager"
            [disabled]="busy || managerPending"
            (click)="choose.emit('manager')"
          >
            <span class="leos-help-sheet__action-label">{{ managerLabel }}</span>
            <span class="leos-help-sheet__action-hint">
              {{ managerPending ? managerPendingHint : managerIdleHint }}
            </span>
          </button>

          <button type="button" class="leos-help-sheet__cancel" (click)="dismiss.emit()">
            Not now
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .leos-help-sheet {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .leos-help-sheet__backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(40, 28, 18, 0.35);
        cursor: pointer;
      }
      .leos-help-sheet__panel {
        position: relative;
        width: min(28rem, 100%);
        padding: 1.25rem 1.25rem 1.75rem;
        border-radius: 1.25rem 1.25rem 0 0;
        background: var(--leos-surface, #f7f1e8);
        box-shadow: 0 -8px 32px rgba(40, 28, 18, 0.12);
        animation: leos-help-up 0.28s ease-out;
      }
      @keyframes leos-help-up {
        from {
          transform: translateY(1rem);
          opacity: 0.6;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .leos-help-sheet__title {
        margin: 0 0 0.35rem;
        font-family: var(--leos-font-display, Fraunces, Georgia, serif);
        font-size: 1.35rem;
        font-weight: 600;
        color: var(--leos-ink, #2a2118);
      }
      .leos-help-sheet__blurb {
        margin: 0 0 1rem;
        font-size: 0.95rem;
        color: var(--leos-muted, #6b5c4d);
      }
      .leos-help-sheet__action {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.15rem;
        width: 100%;
        margin-bottom: 0.65rem;
        padding: 0.95rem 1rem;
        border: 1px solid rgba(42, 33, 24, 0.1);
        border-radius: 0.85rem;
        background: #fff;
        text-align: left;
        cursor: pointer;
        min-height: 44px;
      }
      .leos-help-sheet__action:disabled {
        opacity: 0.7;
        cursor: default;
      }
      .leos-help-sheet__action--manager {
        border-color: rgba(196, 92, 62, 0.28);
        background: rgba(196, 92, 62, 0.06);
      }
      .leos-help-sheet__action-label {
        font-weight: 650;
        font-size: 1.05rem;
        color: var(--leos-ink, #2a2118);
      }
      .leos-help-sheet__action-hint {
        font-size: 0.85rem;
        color: var(--leos-muted, #6b5c4d);
      }
      .leos-help-sheet__cancel {
        display: block;
        width: 100%;
        margin-top: 0.35rem;
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
export class GuestHelpSheetComponent {
  @Input() open = false;
  @Input() busy = false;
  @Input() servicePending = false;
  @Input() managerPending = false;
  /** Pack-aware staff assist copy (waiter · counter · floor). */
  @Input() serviceLabel = 'Request Waiter';
  @Input() serviceIdleHint = 'Something at the table';
  @Input() servicePendingHint = 'Waiter notified';
  /** Pack-aware manager / lead assist copy. */
  @Input() managerLabel = 'Speak to Manager';
  @Input() managerIdleHint = 'A private matter';
  @Input() managerPendingHint = 'Manager notified';
  @Output() choose = new EventEmitter<GuestHelpKind>();
  @Output() dismiss = new EventEmitter<void>();
}
