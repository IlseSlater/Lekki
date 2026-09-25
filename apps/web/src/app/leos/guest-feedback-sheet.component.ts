import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Guest leave-moment feedback — one question when Studio guestDesign.feedback is on.
 */
@Component({
  selector: 'leos-guest-feedback-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div class="leos-guest-feedback" role="dialog" aria-modal="true" aria-labelledby="guest-feedback-title">
        <button
          type="button"
          class="leos-guest-feedback__backdrop"
          aria-label="Skip feedback"
          (click)="skip.emit()"
        ></button>
        <div class="leos-guest-feedback__panel">
          <h2 id="guest-feedback-title" class="leos-guest-feedback__title">How was it?</h2>
          <p class="leos-guest-feedback__blurb">One moment for the team — optional.</p>

          <button
            type="button"
            class="leos-guest-feedback__action"
            [disabled]="busy"
            (click)="delight.emit()"
          >
            <span class="leos-guest-feedback__action-label">It was lovely</span>
          </button>

          <button
            type="button"
            class="leos-guest-feedback__action leos-guest-feedback__action--concern"
            [disabled]="busy"
            (click)="showConcern = true"
          >
            <span class="leos-guest-feedback__action-label">Something felt off</span>
          </button>

          @if (showConcern) {
            <label class="leos-guest-feedback__note">
              <span class="visually-hidden">What felt off</span>
              <textarea
                rows="3"
                maxlength="280"
                [(ngModel)]="note"
                placeholder="Tell them in a sentence (optional)"
              ></textarea>
            </label>
            <button
              type="button"
              class="leos-btn leos-btn--primary leos-guest-feedback__send"
              [disabled]="busy"
              (click)="concern.emit(note.trim())"
            >
              {{ busy ? 'Sending…' : 'Send' }}
            </button>
          }

          <button type="button" class="leos-guest-feedback__cancel" [disabled]="busy" (click)="skip.emit()">
            Not now
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .leos-guest-feedback {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .leos-guest-feedback__backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(40, 28, 18, 0.35);
        cursor: pointer;
      }
      .leos-guest-feedback__panel {
        position: relative;
        width: min(28rem, 100%);
        padding: 1.25rem 1.25rem 1.75rem;
        border-radius: 1.25rem 1.25rem 0 0;
        background: var(--leos-surface, #f7f1e8);
        box-shadow: 0 -8px 32px rgba(40, 28, 18, 0.12);
        animation: leos-gf-up 0.28s ease-out;
      }
      @keyframes leos-gf-up {
        from {
          transform: translateY(1rem);
          opacity: 0.6;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .leos-guest-feedback__title {
        margin: 0 0 0.35rem;
        font-family: var(--leos-font-display, Fraunces, Georgia, serif);
        font-size: 1.35rem;
        font-weight: 600;
      }
      .leos-guest-feedback__blurb {
        margin: 0 0 1rem;
        color: var(--leos-ink-muted, #6b7280);
        font-size: 0.95rem;
      }
      .leos-guest-feedback__action {
        display: block;
        width: 100%;
        margin: 0 0 0.55rem;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(40, 28, 18, 0.12);
        border-radius: 0.85rem;
        background: #fff;
        text-align: left;
        font: inherit;
        cursor: pointer;
      }
      .leos-guest-feedback__action:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .leos-guest-feedback__action-label {
        font-weight: 600;
        color: var(--leos-ink, #1b2230);
      }
      .leos-guest-feedback__note {
        display: block;
        margin: 0.5rem 0;
      }
      .leos-guest-feedback__note textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 0.75rem;
        border: 1px solid rgba(40, 28, 18, 0.14);
        border-radius: 0.75rem;
        font: inherit;
        resize: vertical;
        background: #fff;
      }
      .leos-guest-feedback__send {
        width: 100%;
        margin-bottom: 0.5rem;
      }
      .leos-guest-feedback__cancel {
        display: block;
        width: 100%;
        margin-top: 0.25rem;
        padding: 0.75rem;
        border: 0;
        background: transparent;
        color: var(--leos-ink-muted, #6b7280);
        font: inherit;
        cursor: pointer;
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
    `,
  ],
})
export class GuestFeedbackSheetComponent {
  @Input() open = false;
  @Input() busy = false;
  @Output() delight = new EventEmitter<void>();
  @Output() concern = new EventEmitter<string>();
  @Output() skip = new EventEmitter<void>();

  showConcern = false;
  note = '';
}
