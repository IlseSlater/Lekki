import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Feedback sheet — Grow door (S-16). Same sheet anatomy as payouts / guest-help.
 */
@Component({
  selector: 'leos-feedback-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="leos-feedback-sheet" role="dialog" aria-modal="true" aria-labelledby="feedback-sheet-title">
        <button
          type="button"
          class="leos-feedback-sheet__backdrop"
          aria-label="Close feedback"
          (click)="dismiss.emit()"
        ></button>
        <div class="leos-feedback-sheet__panel">
          <h2 id="feedback-sheet-title" class="leos-feedback-sheet__title">How guests felt</h2>

          @if (loading) {
            <p class="leos-feedback-sheet__line">Gathering tonight’s words…</p>
          } @else if (error) {
            <p class="leos-feedback-sheet__line" role="alert">{{ error }}</p>
          } @else {
            <p class="leos-feedback-sheet__line leos-feedback-sheet__line--sentiment">{{ sentimentLine }}</p>
            @if (flaggedLine) {
              <p class="leos-feedback-sheet__line leos-feedback-sheet__line--flagged">{{ flaggedLine }}</p>
              @if (canReply) {
                <button
                  type="button"
                  class="leos-btn leos-btn--primary leos-feedback-sheet__reply"
                  [disabled]="replyBusy"
                  (click)="heard.emit()"
                >
                  {{ replyBusy ? 'Saving…' : replyLabel }}
                </button>
              }
            }
          }

          <button type="button" class="leos-feedback-sheet__cancel" (click)="dismiss.emit()">
            Close
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .leos-feedback-sheet {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .leos-feedback-sheet__backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(40, 28, 18, 0.35);
        cursor: pointer;
      }
      .leos-feedback-sheet__panel {
        position: relative;
        width: min(28rem, 100%);
        padding: 1.25rem 1.25rem 1.75rem;
        border-radius: 1.25rem 1.25rem 0 0;
        background: var(--leos-surface, #f7f1e8);
        box-shadow: 0 -8px 32px rgba(40, 28, 18, 0.12);
        animation: leos-feedback-up 0.28s ease-out;
      }
      @keyframes leos-feedback-up {
        from {
          transform: translateY(1rem);
          opacity: 0.6;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .leos-feedback-sheet__title {
        margin: 0 0 0.75rem;
        font-family: var(--leos-font-display, Fraunces, Georgia, serif);
        font-size: 1.35rem;
        font-weight: 600;
        color: var(--studio-ink, #1b2230);
      }
      .leos-feedback-sheet__line {
        margin: 0 0 0.65rem;
        font-size: 1.05rem;
        line-height: 1.45;
        color: var(--studio-ink, #1b2230);
      }
      .leos-feedback-sheet__line--flagged {
        color: var(--studio-ink-secondary, #4b5563);
        font-style: italic;
      }
      .leos-feedback-sheet__reply {
        width: 100%;
        margin: 0.5rem 0 0.75rem;
      }
      .leos-feedback-sheet__cancel {
        display: block;
        width: 100%;
        margin-top: 0.25rem;
        padding: 0.75rem;
        border: 0;
        border-radius: 0.75rem;
        background: transparent;
        color: var(--studio-ink-secondary, #6b7280);
        font: inherit;
        cursor: pointer;
      }
    `,
  ],
})
export class FeedbackSheetComponent {
  @Input() open = false;
  @Input() loading = false;
  @Input() error = '';
  @Input() sentimentLine = '';
  @Input() flaggedLine = '';
  @Input() canReply = false;
  @Input() replyBusy = false;
  @Input() replyLabel = 'Got it';
  @Output() dismiss = new EventEmitter<void>();
  @Output() heard = new EventEmitter<void>();
}
