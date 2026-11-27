import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeosApiService } from '../services/leos-api.service';
import { friendShareText, safeReviewUrl, whatsappShareUrl } from './review-links';
import { noteWithStars } from './pay-choices';

/**
 * After the meal. Every guest sees the same three choices at equal weight:
 * a Google review, a private note to the manager, and sending the place to a friend.
 * The glass card is the decision; nothing here is gold.
 */
@Component({
  selector: 'leos-guest-after-pay',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="ap leos-table__card" aria-labelledby="ap-title">
      <h2 id="ap-title" class="leos-table__card-title">How was it?</h2>
      <p class="leos-table__card-note">Tell {{ placeName || 'the team' }} however suits you.</p>

      <div class="ap__choices">
        @if (reviewHref) {
          <a class="ap__choice" [href]="reviewHref" target="_blank" rel="noopener noreferrer">
            Leave a Google review
          </a>
        }
        <button type="button" class="ap__choice" [attr.aria-expanded]="noteOpen" (click)="noteOpen = !noteOpen">
          Tell the manager privately
        </button>
        <a class="ap__choice" [href]="friendHref" target="_blank" rel="noopener noreferrer">
          Send {{ placeName || 'this place' }} to a friend
        </a>
      </div>

      @if (noteOpen && !sent) {
        @for (row of starRows; track row.key) {
          <div class="ap__stars" role="radiogroup" [attr.aria-label]="row.label + ' rating'">
            <span class="ap__stars-label">{{ row.label }}</span>
            @for (n of [1, 2, 3, 4, 5]; track n) {
              <button
                type="button"
                role="radio"
                class="ap__star"
                [class.ap__star--on]="stars[row.key] >= n"
                [attr.aria-checked]="stars[row.key] === n"
                [attr.aria-label]="n + (n === 1 ? ' star' : ' stars')"
                (click)="stars[row.key] = n"
              >
                ★
              </button>
            }
          </div>
        }
        <label class="ap__note">
          <span class="visually-hidden">Your note to the manager</span>
          <textarea
            class="ap__textarea"
            rows="3"
            maxlength="1000"
            [(ngModel)]="note"
            placeholder="Only the manager sees this."
          ></textarea>
        </label>
        @if (error) {
          <p class="ap__error" role="alert">{{ error }}</p>
        }
        <button type="button" class="ap__choice ap__send" [disabled]="busy || !message" (click)="send()">
          {{ busy ? 'Sending…' : 'Send to the manager' }}
        </button>
      }
      @if (sent) {
        <p class="ap__thanks" role="status">Thank you. The manager will read this.</p>
      }
    </section>
  `,
  styles: [
    `
      .ap {
        position: static;
        margin: 1rem 0 0;
      }
      .ap__choices {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .ap__choice {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 2.75rem;
        padding: 0.65rem 1rem;
        border: 1px solid var(--leos-table-glass-ink-muted);
        border-radius: var(--leos-radius-button);
        background: transparent;
        color: var(--leos-table-glass-ink);
        font: inherit;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
      }
      .ap__choice:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
      }
      .ap__choice:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .ap__send {
        margin-top: 0.5rem;
        width: 100%;
      }
      .ap__note {
        display: block;
        margin-top: 0.75rem;
      }
      .ap__stars {
        display: flex;
        align-items: center;
        gap: 0.15rem;
        margin-top: 0.6rem;
      }
      .ap__stars-label {
        width: 4.5rem;
        font-weight: 600;
        color: var(--leos-table-glass-ink);
      }
      .ap__star {
        width: 2.75rem;
        height: 2.75rem;
        border: 0;
        background: none;
        font-size: 1.5rem;
        line-height: 1;
        color: var(--leos-table-glass-ink-muted);
        cursor: pointer;
      }
      .ap__star--on {
        color: var(--leos-gold, #d7a14a);
      }
      .ap__textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 0.75rem;
        border: 1px solid var(--leos-table-glass-ink-muted);
        border-radius: var(--leos-radius-input);
        background: rgba(255, 255, 255, 0.08);
        color: var(--leos-table-glass-ink);
        font: inherit;
        resize: vertical;
      }
      .ap__error {
        margin: 0.5rem 0 0;
        font-size: 0.875rem;
        color: var(--leos-table-waiting);
      }
      .ap__thanks {
        margin: 0.75rem 0 0;
        color: var(--leos-table-glass-ink);
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }
    `,
  ],
})
export class GuestAfterPayComponent {
  private readonly api = inject(LeosApiService);

  @Input() placeName = '';
  /** Venue's Google review link. Hidden when it is not a secure address. */
  @Input() set reviewUrl(value: unknown) {
    this.reviewHref = safeReviewUrl(value);
  }
  @Input() sessionId = '';
  @Input() participantId = '';
  @Input() participantSecret = '';

  reviewHref = '';
  noteOpen = false;
  note = '';
  busy = false;
  sent = false;
  error = '';
  /** Food and service stars go with the private note — only the manager sees them. */
  readonly starRows = [
    { key: 'food' as const, label: 'Food' },
    { key: 'service' as const, label: 'Service' },
  ];
  stars: Record<'food' | 'service', number> = { food: 0, service: 0 };

  /** What the manager will read: the stars given, then the words. */
  get message(): string {
    return noteWithStars(this.stars.food, this.stars.service, this.note);
  }

  get friendHref(): string {
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    return whatsappShareUrl(friendShareText(this.placeName), origin);
  }

  send() {
    const message = this.message;
    if (this.busy || !message || !this.sessionId || !this.participantId) return;
    this.busy = true;
    this.error = '';
    this.api
      .leaveGuestNote(this.sessionId, {
        participantId: this.participantId,
        participantSecret: this.participantSecret,
        note: message,
      })
      .subscribe({
        next: () => {
          this.busy = false;
          this.sent = true;
        },
        error: () => {
          this.busy = false;
          this.error = 'We couldn’t send that. Please try again.';
        },
      });
  }
}
