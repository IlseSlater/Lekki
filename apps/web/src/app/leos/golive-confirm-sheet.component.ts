import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { GoLiveConfirmCopy } from '../studio/golive-confirm';

/**
 * Cinematic go-live peak. Gold only on Open for guests.
 * Station, never a person. No celebration.
 */
@Component({
  selector: 'leos-golive-confirm-sheet',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (open && copy) {
      <div
        class="gcs-live leos-register leos-register--cinematic leos-register-halo"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <button type="button" class="gcs-live__backdrop" aria-label="Not yet" (click)="onNotYet()"></button>
        <div class="gcs-live__card leos-emboss" #card>
          <h2 [id]="titleId" class="gcs-live__title">{{ copy.headline }}</h2>
          <ol class="gcs-live__clauses">
            <li>{{ copy.scan }}</li>
            <li>{{ copy.orders }}</li>
            <li>
              {{ copy.pay }}
              @if (!copy.payConnected) {
                <a class="gcs-live__connect" routerLink="/studio/setup/payments" (click)="dismiss.emit()">Connect</a>
              }
            </li>
          </ol>
          <div class="gcs-live__actions">
            <button type="button" class="leos-btn leos-btn--secondary gcs-live__notyet" (click)="onNotYet()">
              Not yet
            </button>
            <button
              type="button"
              class="leos-btn leos-btn--peak"
              #peak
              (click)="confirm.emit()"
            >
              Open for guests
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .gcs-live {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: grid;
        place-items: center;
        padding: 1.5rem;
      }
      .gcs-live__backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        padding: 0;
        background: color-mix(in srgb, var(--leos-obsidian-ground) 72%, transparent);
        cursor: pointer;
        animation: gcs-live-dim var(--leos-duration-sheet) var(--leos-ease) both;
      }
      .gcs-live__card {
        position: relative;
        z-index: 1;
        width: min(28rem, 100%);
        padding: 1.75rem 1.5rem 1.35rem;
        border-radius: 1.25rem;
        background: var(--leos-obsidian-card);
        color: var(--leos-obsidian-ink);
        border: 1px solid var(--leos-obsidian-hairline);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        animation: gcs-live-rise var(--leos-duration-sheet) var(--leos-ease) both;
      }
      .gcs-live__title {
        margin: 0 0 1.15rem;
        font-family: var(--leos-font-display);
        font-size: 1.875rem;
        font-weight: 400;
        letter-spacing: -0.03em;
        line-height: 1.2;
        color: var(--leos-obsidian-ink);
      }
      .gcs-live__clauses {
        margin: 0 0 1.5rem;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        font-size: 0.9375rem;
        line-height: 1.45;
        color: var(--leos-obsidian-ink-muted);
      }
      .gcs-live__clauses li {
        animation: gcs-live-clause var(--leos-duration-enter) var(--leos-ease) both;
      }
      .gcs-live__clauses li:nth-child(1) {
        animation-delay: var(--leos-stagger);
      }
      .gcs-live__clauses li:nth-child(2) {
        animation-delay: calc(var(--leos-stagger) * 2);
      }
      .gcs-live__clauses li:nth-child(3) {
        animation-delay: calc(var(--leos-stagger) * 3);
      }
      .gcs-live__connect {
        display: inline;
        margin-left: 0.4rem;
        color: var(--leos-obsidian-ink);
        font-weight: 500;
        text-decoration: underline;
        text-underline-offset: 0.18em;
      }
      .gcs-live__actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
      }
      .gcs-live__notyet {
        color: var(--leos-obsidian-ink);
        border-color: var(--leos-obsidian-hairline);
        background: transparent;
      }
      .gcs-live__actions .leos-btn--peak {
        animation: gcs-live-clause var(--leos-duration-enter) var(--leos-ease) both;
        animation-delay: calc(var(--leos-stagger) * 4);
      }
      @keyframes gcs-live-dim {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes gcs-live-rise {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes gcs-live-clause {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .gcs-live__backdrop,
        .gcs-live__card,
        .gcs-live__clauses li,
        .gcs-live__actions .leos-btn--peak {
          animation: none;
        }
      }
    `,
  ],
})
export class GoliveConfirmSheetComponent {
  @Input() open = false;
  @Input() copy: GoLiveConfirmCopy | null = null;
  @Output() confirm = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  @ViewChild('peak') peak?: ElementRef<HTMLButtonElement>;

  readonly titleId = 'golive-confirm-title';

  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent) {
    if (!this.open) return;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      this.onNotYet();
    }
  }

  onNotYet() {
    this.dismiss.emit();
  }
}
