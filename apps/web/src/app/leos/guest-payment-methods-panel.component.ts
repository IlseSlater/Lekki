import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

type PaymentMethodStatus = 'none' | 'locked' | 'ready';
type PanelView = 'home' | 'details';

/**
 * Guest payment methods panel — UI-only first ship.
 * Real card token persistence waits on backend PaymentCapability.
 */
@Component({
  selector: 'leos-guest-payment-methods-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div
        class="pm-panel"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="view === 'details' ? 'Card details' : 'Payment cards'"
      >
        <button
          type="button"
          class="pm-panel__backdrop"
          aria-label="Close"
          (click)="close()"
        ></button>

        <div class="pm-panel__sheet">
          @if (view === 'home') {
            <h2 class="pm-panel__title">Cards</h2>
            <p class="pm-panel__blurb">
              Choose how you’ll pay for this visit. Nothing is charged until you confirm on the bill.
            </p>

            <div class="pm-card">
              <div class="pm-card__tile">
                <div class="pm-card__brand">{{ brandLabel }}</div>
                <div class="pm-card__row">
                  <span class="pm-card__chip" aria-hidden="true">●</span>
                  <span class="pm-card__waves" aria-hidden="true">︿︿</span>
                </div>
              </div>

              <div class="pm-card__meta">
                <div class="pm-card__meta-line">
                  <span class="pm-card__meta-label">{{ cardLabel }}</span>
                  <span class="pm-card__meta-value">•••• {{ last4 }}</span>
                </div>

                @if (ready) {
                  <div class="pm-toggle-row">
                    <span class="pm-toggle-row__label">{{
                      unlocked ? 'Card ready' : 'Card remembered'
                    }}</span>
                    <label class="pm-switch">
                      <input
                        type="checkbox"
                        [checked]="unlocked"
                        (change)="onUnlockedToggle($event)"
                      />
                      <span class="pm-switch__track" aria-hidden="true"></span>
                      <span class="pm-switch__thumb" aria-hidden="true"></span>
                    </label>
                  </div>
                }
              </div>
            </div>

            @if (!ready) {
              <button
                type="button"
                class="leos-btn leos-btn--primary pm-panel__primary"
                (click)="addCard()"
              >
                Add card
              </button>
            } @else {
              <div class="pm-panel__rows">
                <button type="button" class="pm-panel__row" (click)="view = 'details'">
                  <span>Card details</span>
                  <span class="pm-panel__chev" aria-hidden="true">›</span>
                </button>
              </div>
            }

            <button type="button" class="pm-panel__cancel" (click)="close()">
              {{ ready ? 'Done' : 'Not now' }}
            </button>
          } @else {
            <button type="button" class="pm-panel__back" (click)="view = 'home'" aria-label="Back">
              ←
            </button>
            <h2 class="pm-panel__title">Card details</h2>
            <p class="pm-panel__blurb">Update how this card appears for your visit.</p>

            <label class="pm-field">
              <span class="pm-field__label">Nickname</span>
              <input class="pm-field__input" type="text" [(ngModel)]="cardLabel" maxlength="32" />
            </label>

            <label class="pm-field">
              <span class="pm-field__label">Last 4 digits</span>
              <input
                class="pm-field__input"
                type="text"
                inputmode="numeric"
                [(ngModel)]="last4"
                maxlength="4"
                (ngModelChange)="onLast4Change($event)"
              />
            </label>

            <label class="pm-field">
              <span class="pm-field__label">Brand</span>
              <input class="pm-field__input" type="text" [(ngModel)]="brandLabel" maxlength="24" />
            </label>

            <button
              type="button"
              class="leos-btn leos-btn--primary pm-panel__primary"
              (click)="saveDetails()"
            >
              Save
            </button>
            <button type="button" class="pm-panel__cancel" (click)="view = 'home'">
              Cancel
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .pm-panel {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: grid;
        place-items: center;
        padding: 1rem;
      }

      .pm-panel__backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(27, 34, 48, 0.35);
        cursor: pointer;
        z-index: 0;
      }

      .pm-panel__sheet {
        position: relative;
        z-index: 1;
        width: min(100%, 26rem);
        max-height: min(90dvh, 40rem);
        overflow: auto;
        border-radius: 1.25rem;
        padding: 1.15rem 1.15rem 1.25rem;
        background: var(--leos-surface, #fff);
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.12);
        animation: leos-help-up 0.28s ease-out;
      }

      @keyframes leos-help-up {
        from {
          transform: translateY(0.75rem);
          opacity: 0.6;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .pm-panel__back {
        width: 2.5rem;
        height: 2.5rem;
        border: 0;
        border-radius: 999px;
        background: var(--leos-warm-sand, #faf7f2);
        border: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        color: var(--leos-ink, #1b2230);
        font-size: 1.1rem;
        cursor: pointer;
        margin-bottom: 0.65rem;
      }

      .pm-panel__title {
        margin: 0 0 0.35rem;
        font-family: var(--leos-font-display, Fraunces, Georgia, serif);
        font-size: 1.35rem;
        font-weight: 600;
        color: var(--leos-ink, #1b2230);
      }

      .pm-panel__blurb {
        margin: 0 0 1rem;
        font-size: 0.95rem;
        color: var(--leos-ink-secondary, #6b7280);
      }

      .pm-card {
        border: 1px solid var(--leos-border-card, #eee7de);
        border-radius: 1.1rem;
        background: color-mix(in srgb, var(--leos-warm-sand, #faf7f2) 55%, #fff);
        overflow: hidden;
      }

      .pm-card__tile {
        padding: 1rem 1rem 0.85rem;
        background: rgba(215, 161, 74, 0.12);
      }

      .pm-card__brand {
        font-weight: 800;
        letter-spacing: 0.08em;
        color: var(--leos-ink, #1b2230);
        font-size: 1.05rem;
      }

      .pm-card__row {
        margin-top: 0.6rem;
        display: flex;
        justify-content: flex-start;
        gap: 0.55rem;
        align-items: center;
      }

      .pm-card__chip {
        width: 2rem;
        height: 1.35rem;
        border-radius: 0.35rem;
        display: grid;
        place-items: center;
        background: rgba(215, 161, 74, 0.2);
        color: var(--leos-ink, #1b2230);
        font-size: 0.75rem;
      }

      .pm-card__waves {
        opacity: 0.85;
        letter-spacing: 0.25em;
      }

      .pm-card__meta {
        padding: 0.9rem 1rem 1rem;
      }

      .pm-card__meta-line {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
        font-weight: 650;
        color: var(--leos-ink, #1b2230);
      }

      .pm-card__meta-label {
        font-size: 0.95rem;
        color: var(--leos-ink-secondary, #6b7280);
        font-weight: 650;
      }

      .pm-card__meta-value {
        font-size: 0.95rem;
      }

      .pm-toggle-row {
        margin-top: 0.85rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .pm-toggle-row__label {
        font-size: 0.95rem;
        font-weight: 650;
        color: var(--leos-ink, #1b2230);
      }

      .pm-switch {
        position: relative;
        width: 2.35rem;
        height: 1.35rem;
        display: inline-block;
        cursor: pointer;
      }

      .pm-switch input {
        position: absolute;
        inset: 0;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
        z-index: 2;
      }

      .pm-switch__track {
        position: absolute;
        inset: 0;
        background: var(--leos-warm-sand-dark, #e7e2db);
        border-radius: 999px;
        transition: background 0.2s ease-out;
        z-index: 0;
      }

      .pm-switch__thumb {
        position: absolute;
        top: 0.15rem;
        left: 0.15rem;
        width: 1.05rem;
        height: 1.05rem;
        border-radius: 999px;
        background: #fff;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        transition: transform 0.2s ease-out;
        z-index: 1;
        pointer-events: none;
      }

      .pm-switch input:checked + .pm-switch__track {
        background: var(--leos-gold, #d7a14a);
      }

      .pm-switch input:checked ~ .pm-switch__thumb {
        transform: translateX(1rem);
      }

      .pm-field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 0.85rem;
      }

      .pm-field__label {
        font-size: 0.8125rem;
        font-weight: 650;
        color: var(--leos-ink-secondary, #6b7280);
      }

      .pm-field__input {
        min-height: 2.85rem;
        border: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        border-radius: 12px;
        padding: 0.65rem 0.85rem;
        font: inherit;
        font-size: 1rem;
        color: var(--leos-ink, #1b2230);
        background: #fff;
      }

      .pm-panel__primary {
        margin-top: 1rem;
        width: 100%;
      }

      .pm-panel__rows {
        margin-top: 1rem;
        display: grid;
        gap: 0.6rem;
      }

      .pm-panel__row {
        border: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        background: #fff;
        border-radius: 1rem;
        padding: 0.85rem 0.95rem;
        font: inherit;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 2.85rem;
      }

      .pm-panel__chev {
        opacity: 0.6;
        font-weight: 900;
      }

      .pm-panel__cancel {
        margin-top: 0.9rem;
        width: 100%;
        border: 0;
        background: transparent;
        color: var(--leos-ink-secondary, #6b7280);
        font: inherit;
        padding: 0.6rem 0.25rem;
        cursor: pointer;
        min-height: 44px;
      }
    `,
  ],
})
export class GuestPaymentMethodsPanelComponent implements OnChanges {
  @Input() open = false;
  @Input() savedPaymentMethodStatus: PaymentMethodStatus = 'none';

  @Output() dismiss = new EventEmitter<void>();
  @Output() added = new EventEmitter<string>();
  @Output() unlockedChange = new EventEmitter<boolean>();
  @Output() labelChange = new EventEmitter<string>();

  view: PanelView = 'home';
  ready = false;
  unlocked = false;
  brandLabel = 'Card';
  cardLabel = 'Personal card';
  last4 = '4242';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['savedPaymentMethodStatus'] || changes['open']) {
      this.syncFromStatus();
    }
    if (changes['open']?.currentValue === true) {
      this.view = 'home';
      this.restoreVisitMethod();
    }
  }

  private syncFromStatus() {
    this.ready = this.savedPaymentMethodStatus !== 'none';
    this.unlocked = this.savedPaymentMethodStatus === 'ready';
  }

  private displayLabel(): string {
    const brand = (this.brandLabel || 'Card').trim() || 'Card';
    const digits = (this.last4 || '••••').padStart(4, '•').slice(-4);
    return `${brand} · •••• ${digits}`;
  }

  private persistVisitMethod() {
    try {
      sessionStorage.setItem(
        'leos.guest.payMethod',
        JSON.stringify({
          brand: this.brandLabel,
          label: this.cardLabel,
          last4: this.last4,
        }),
      );
    } catch {
      /* ignore */
    }
  }

  private restoreVisitMethod() {
    try {
      const raw = sessionStorage.getItem('leos.guest.payMethod');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { brand?: string; label?: string; last4?: string };
      if (parsed.brand) this.brandLabel = parsed.brand;
      if (parsed.label) this.cardLabel = parsed.label;
      if (parsed.last4) this.last4 = parsed.last4;
      this.labelChange.emit(this.displayLabel());
    } catch {
      /* ignore */
    }
  }

  close() {
    this.view = 'home';
    this.dismiss.emit();
  }

  addCard() {
    this.ready = true;
    this.unlocked = true;
    if (!this.brandLabel.trim()) this.brandLabel = 'Card';
    this.persistVisitMethod();
    const label = this.displayLabel();
    this.labelChange.emit(label);
    this.added.emit(label);
    this.unlockedChange.emit(true);
  }

  onUnlockedToggle(evt: Event) {
    const checked = (evt.target as HTMLInputElement)?.checked ?? false;
    this.unlocked = checked;
    this.ready = true;
    this.unlockedChange.emit(checked);
  }

  onLast4Change(value: string) {
    this.last4 = (value ?? '').replace(/\D/g, '').slice(0, 4);
  }

  saveDetails() {
    if (this.last4.length < 4) this.last4 = '4242';
    if (!this.cardLabel.trim()) this.cardLabel = 'Personal card';
    if (!this.brandLabel.trim()) this.brandLabel = 'Card';
    this.persistVisitMethod();
    this.labelChange.emit(this.displayLabel());
    this.view = 'home';
  }
}
