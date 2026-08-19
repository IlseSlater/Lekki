import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuantityStepperComponent } from './quantity-stepper.component';
import { LeosMoneyPipe } from './leos-money.pipe';
import { safeGuestImageUrl } from './catalogue-parity';

type FoodIcon =
  | 'burger'
  | 'salad'
  | 'drink'
  | 'coffee'
  | 'pastry'
  | 'bowl'
  | 'plate';

/**
 * LEK-028 Menu Card (Frozen) — catalogue row on Browse.
 * Thumb (food icon) left · copy · + / qty pill.
 */
@Component({
  selector: 'leos-menu-card',
  standalone: true,
  imports: [CommonModule, LeosMoneyPipe, QuantityStepperComponent],
  template: `
    <div class="leos-menu-card" role="listitem">
      <div
        class="leos-menu-card__thumb"
        aria-hidden="true"
        [attr.data-icon]="foodIcon"
        [attr.data-has-image]="safeImageUrl ? 'true' : 'false'"
      >
        @if (quantity > 0) {
          <span class="leos-menu-card__qty-badge">{{ quantity }}</span>
        }
        @if (safeImageUrl) {
          <img class="leos-menu-card__img" [src]="safeImageUrl" alt="" width="64" height="64" />
        }
        @switch (foodIcon) {
          @case ('burger') {
            <svg class="leos-menu-card__icon" viewBox="0 0 48 48" focusable="false">
              <path
                fill="currentColor"
                d="M8 20c0-6.6 7.2-10 16-10s16 3.4 16 10H8zm0 4h32v3c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2v-3zm2 8h28c1.7 0 3 1.3 3 3v1c0 1.7-1.3 3-3 3H10c-1.7 0-3-1.3-3-3v-1c0-1.7 1.3-3 3-3zm2-5h24v2H12v-2z"
              />
            </svg>
          }
          @case ('salad') {
            <svg class="leos-menu-card__icon" viewBox="0 0 48 48" focusable="false">
              <path
                fill="currentColor"
                d="M24 8c-2.5 4-8 6-12 7 3 1.5 6 5 7 9-1-4-5-7-8-8 5 6 7 12 7 16h12c0-4 2-10 7-16-3 1-7 4-8 8 1-4 4-7.5 7-9-4-1-9.5-3-12-7zm-10 28h20c1 0 2 .8 2 2s-1 2-2 2H14c-1 0-2-.8-2-2s1-2 2-2z"
              />
            </svg>
          }
          @case ('drink') {
            <svg class="leos-menu-card__icon" viewBox="0 0 48 48" focusable="false">
              <path
                fill="currentColor"
                d="M14 8h20l-2 6H16l-2-6zm3 8h14l-2.5 24a3 3 0 0 1-3 2.5h-3a3 3 0 0 1-3-2.5L17 16zm10 4v14h2V20h-2z"
              />
            </svg>
          }
          @case ('coffee') {
            <svg class="leos-menu-card__icon" viewBox="0 0 48 48" focusable="false">
              <path
                fill="currentColor"
                d="M12 16h22a4 4 0 0 1 0 8h-2v2c0 5.5-4.5 10-10 10s-10-4.5-10-10v-2H10a2 2 0 0 1-2-2v-2a4 4 0 0 1 4-4zm20 4v4h2a2 2 0 0 0 0-4h-2zm-18 4v2c0 4.4 3.6 8 8 8s8-3.6 8-8v-2H14zm-2 18h24v2H12v-2z"
              />
            </svg>
          }
          @case ('pastry') {
            <svg class="leos-menu-card__icon" viewBox="0 0 48 48" focusable="false">
              <path
                fill="currentColor"
                d="M10 30c0-8 6-14 14-16 2 6 8 10 14 10-2 8-8 14-16 14-6 0-12-4-12-8zm8-2c2-4 6-7 10-8-1 4-4 7-8 9l-2-1z"
              />
            </svg>
          }
          @case ('bowl') {
            <svg class="leos-menu-card__icon" viewBox="0 0 48 48" focusable="false">
              <path
                fill="currentColor"
                d="M10 20h28c0 8-5 16-14 18v2h-4v-2C15 36 10 28 10 20zm4 2c1 6 4.5 11 10 13 5.5-2 9-7 10-13H14z"
              />
            </svg>
          }
          @default {
            <svg class="leos-menu-card__icon" viewBox="0 0 48 48" focusable="false">
              <path
                fill="currentColor"
                d="M14 12v10c0 4.4 2.7 8.2 6.5 9.8V38h-2v2h11v-2h-2V31.8c3.8-1.6 6.5-5.4 6.5-9.8V12h-2v10c0 3.9-3.1 7-7 7s-7-3.1-7-7V12h-2zm20 2c0 4 0 8-3 11v13h2v2h-6v-2h2V25c-3-3-3-7-3-11h8z"
              />
            </svg>
          }
        }
      </div>

      <div class="leos-menu-card__body">
        @if (category) {
          <p class="leos-menu-card__badge">{{ category }}</p>
        }
        <h3 class="leos-menu-card__title">{{ label }}</h3>
        @if (description) {
          <p class="leos-muted leos-menu-card__desc">{{ description }}</p>
        }
        <p class="leos-menu-card__price">{{ unitPrice | leosMoney: currency }}</p>
        @if (requiresChoices) {
          <p class="leos-menu-card__choices-cue">Choose options</p>
        }
      </div>

      <div class="leos-menu-card__action">
        @if (requiresChoices) {
          <button
            type="button"
            class="leos-menu-card__add leos-menu-card__add--choices"
            (click)="add.emit()"
            [attr.aria-label]="
              quantity > 0 ? 'Add another ' + label + ' with options' : 'Choose options for ' + label
            "
          >
            +
          </button>
        } @else if (quantity > 0) {
          <leos-quantity-stepper
            [quantity]="quantity"
            [label]="label"
            [allowRemove]="true"
            (quantityChange)="quantityChange.emit($event)"
            (remove)="remove.emit()"
          />
        } @else {
          <button
            type="button"
            class="leos-menu-card__add"
            (click)="add.emit()"
            [attr.aria-label]="'Add ' + label + ' to order'"
          >
            +
          </button>
        }
      </div>
    </div>
  `,
})
export class MenuCardComponent {
  @Input({ required: true }) label = '';
  @Input() category = '';
  @Input() unitPrice = 0;
  @Input() currency = 'ZAR';
  @Input() description = '';
  /** Optional thumbnail for guest menu cards. */
  @Input() imageUrl?: string | null;
  /** Toggle to hide/show all food thumbnails. */
  @Input() showFoodImages = true;
  /** Qty already in Your order for this catalogue item (0 = show +). */
  @Input() quantity = 0;
  /** When true, always show + and open G-04 choices (never inline qty merge). */
  @Input() requiresChoices = false;
  @Output() add = new EventEmitter<void>();
  @Output() quantityChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();

  get safeImageUrl(): string | null {
    return this.showFoodImages ? safeGuestImageUrl(this.imageUrl) : null;
  }

  get foodIcon(): FoodIcon {
    const hay = `${this.label} ${this.category}`.toLowerCase();
    if (/burger|sandwich|wrap/.test(hay)) return 'burger';
    if (/salad|greens|garden/.test(hay)) return 'salad';
    if (/coffee|cappuccino|latte|espresso|flat\s*white|tea/.test(hay)) return 'coffee';
    if (/lager|beer|wine|drink|soda|juice|cocktail/.test(hay)) return 'drink';
    if (/croissant|pastry|muffin|bread|toast/.test(hay)) return 'pastry';
    if (/bowl|granola|soup|porridge/.test(hay)) return 'bowl';
    if (/drink|beverage|coffee/.test(hay)) return 'coffee';
    if (/food|main/.test(hay)) return 'plate';
    return 'plate';
  }
}
