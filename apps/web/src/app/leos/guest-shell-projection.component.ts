import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  type GuestExperienceDesign,
  categoriesFromDesign,
  visibleProjectionItems,
} from '../studio/guest-experience-design';
import { choiceGroupHint, projectionOrderCopy, safeGuestImageUrl } from './catalogue-parity';

type PreviewTab = 'menu' | 'orders' | 'bill';

/**
 * Experience Shell projection for Studio Live Experience.
 * Same grammar guests use after Go Live — never a layout builder.
 */
@Component({
  selector: 'leos-guest-shell-projection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gsp" [class.gsp--fill]="fillFrame" [style.--brand]="brandColour">
      <header class="gsp__header">
        @if (logoSrc) {
          <img class="gsp__logo" [src]="logoSrc" alt="" width="32" height="32" />
        }
        <h2 class="gsp__venue">{{ venueName }}</h2>
        @if (placeCode) {
          <p class="gsp__place">{{ placeCode }}</p>
        }
      </header>

      <div class="gsp__body">
        @if (tab === 'menu') {
          @if (!canBrowse) {
            <p class="gsp__empty">Nothing to browse yet.</p>
          } @else {
            <p class="gsp__hi">{{ greeting }}</p>
            <div class="gsp__chips" role="toolbar" aria-label="Categories">
              <button
                type="button"
                class="gsp__chip"
                [class.gsp__chip--on]="!categoryFilter"
                (click)="categoryFilter = ''"
              >
                All
              </button>
              @for (cat of categoryChips; track cat) {
                <button
                  type="button"
                  class="gsp__chip"
                  [class.gsp__chip--on]="categoryFilter === cat"
                  (click)="categoryFilter = cat"
                >
                  {{ cat }}
                </button>
              }
            </div>
            <ul class="gsp__list" role="list" (click)="onCatalogueClick($event)">
              @for (item of filteredItems; track item.id) {
                <li
                  class="gsp__row"
                  [attr.data-item]="item.id"
                  [attr.data-has-choices]="item.choiceGroups?.length ? 'true' : null"
                >
                  <div class="gsp__thumb" aria-hidden="true">
                    @if (previewQty[item.id]) {
                      <span class="gsp__qty-badge">{{ previewQty[item.id] }}</span>
                    }
                    @if (showFoodImages && itemImage(item.imageUrl)) {
                      <img
                        class="gsp__thumb-img"
                        [src]="itemImage(item.imageUrl)"
                        alt=""
                        width="44"
                        height="44"
                      />
                    }
                  </div>
                  <div class="gsp__meta">
                    <strong>{{ item.label }}</strong>
                    @if (item.description) {
                      <span class="gsp__desc">{{ item.description }}</span>
                    }
                    <span class="gsp__price">{{ item.price }}</span>
                    @if (item.choiceHint) {
                      <span class="gsp__choice-hint">{{ item.choiceHint }}</span>
                    }
                    @if (item.choiceRule) {
                      <span class="gsp__choice-rule">{{ item.choiceRule }}</span>
                    }
                    @if (openChoiceId === item.id && item.choiceGroups?.length) {
                      <div class="gsp__groups">
                        @for (group of item.choiceGroups; track group.id) {
                          <p class="gsp__group-line">
                            <span>{{ group.label }}</span>
                            <span>{{ choiceGroupHint(group) }}</span>
                          </p>
                          <div class="gsp__opts">
                            @for (opt of group.options; track opt.id) {
                              <span class="gsp__opt">
                                @if (showFoodImages && itemImage(opt.imageUrl)) {
                                  <img
                                    class="gsp__opt-img"
                                    [src]="itemImage(opt.imageUrl)"
                                    alt=""
                                    width="22"
                                    height="22"
                                  />
                                }
                                {{ opt.label }}
                              </span>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                  @if (showAdd) {
                    <span class="gsp__add" data-add="true" aria-hidden="true">+</span>
                  }
                </li>
              }
            </ul>
          }
        }

        @if (tab === 'orders') {
          <h3 class="gsp__panel-title">Your {{ transactionPlural }}</h3>
          @if (design.orderFood || design.drinks || design.specialRequests || design.book) {
            <p class="gsp__reassure" role="status">{{ orderCopy.placed }}</p>
            <div class="gsp__sample-line">
              <span>{{ sampleItemLabel }}</span>
              <span>{{ orderCopy.statusLabel }}</span>
            </div>
            <p class="gsp__muted">{{ orderCopy.current }}</p>
          } @else {
            <p class="gsp__empty">Nothing placed yet.</p>
          }
        }

        @if (tab === 'bill') {
          <h3 class="gsp__panel-title">{{ paymentLabel }}</h3>
          @if (hasBillChrome) {
            <div class="gsp__sample-line">
              <span>Visit total</span>
              <span>{{ sampleVisitTotal }}</span>
            </div>
            <div class="gsp__pay">
              @if (payMethods.card) {
                <span>Card</span>
              }
              @if (payMethods.applePay) {
                <span>Apple Pay</span>
              }
              @if (payMethods.googlePay) {
                <span>Google Pay</span>
              }
              @if (design.payAtTable) {
                <span>{{ payAtPlaceLabel }}</span>
              }
              @if (design.splitBill) {
                <span>Split {{ paymentLabel }}</span>
              }
              @if (design.tipStaff) {
                <span>Add a tip</span>
              }
            </div>
          } @else {
            <p class="gsp__empty">Pay isn’t open yet.</p>
          }
        }
      </div>

      <nav class="gsp__dock" aria-label="Guest navigation">
        <button type="button" [class.is-on]="tab === 'menu'" (click)="tab = 'menu'">
          {{ catalogueLabel }}
        </button>
        <button type="button" [class.is-on]="tab === 'orders'" (click)="tab = 'orders'">
          {{ transactionPlural }}
        </button>
        <button type="button" [class.is-on]="tab === 'bill'" (click)="tab = 'bill'">
          {{ paymentLabel }}
        </button>
        @if (design.callStaff) {
          <span class="gsp__dock-quiet" aria-hidden="true">Help</span>
        }
        <span class="gsp__dock-quiet" aria-hidden="true">{{ leaveLabel }}</span>
      </nav>
    </div>
  `,
  styles: [
    `
      .gsp {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: #faf7f2;
        color: #1b2230;
        font-family: 'Sora', system-ui, sans-serif;
        border-radius: 0;
        overflow: hidden;
        border: none;
        animation: gsp-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      @keyframes gsp-in {
        from {
          opacity: 0.65;
        }
        to {
          opacity: 1;
        }
      }
      .gsp--fill {
        min-height: 100%;
      }
      .gsp__header {
        padding: 1rem 1.1rem 0.75rem;
        background: #faf7f2;
      }
      .gsp__logo {
        width: 2rem;
        height: 2rem;
        border-radius: 8px;
        object-fit: cover;
        border: 2px solid color-mix(in srgb, var(--brand, #d7a14a) 50%, #fff);
      }
      .gsp__venue {
        margin: 0.2rem 0 0;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 1.5rem;
        font-weight: 650;
        letter-spacing: -0.03em;
      }
      .gsp__place {
        margin: 0.15rem 0 0;
        font-size: 0.8125rem;
        color: #6b7280;
      }
      .gsp__body {
        flex: 1;
        overflow: auto;
        padding: 0.5rem 1.1rem 1rem;
      }
      .gsp__hi {
        margin: 0 0 0.75rem;
        font-size: 0.9375rem;
        font-weight: 600;
      }
      .gsp__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 0.85rem;
      }
      .gsp__chip {
        padding: 0.3rem 0.65rem;
        border-radius: 999px;
        border: 1px solid #e7e2db;
        background: transparent;
        font: inherit;
        font-size: 0.75rem;
        font-weight: 550;
        color: #6b7280;
        cursor: pointer;
      }
      .gsp__chip--on {
        border-color: var(--brand, #d7a14a);
        color: #1b2230;
        background: color-mix(in srgb, var(--brand, #d7a14a) 14%, transparent);
      }
      .gsp__list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .gsp__row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid #e7e2db;
      }
      .gsp__thumb {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0.45rem;
        flex-shrink: 0;
        position: relative;
        overflow: hidden;
        background: linear-gradient(
          145deg,
          color-mix(in srgb, var(--brand, #d7a14a) 18%, #efe8dc),
          color-mix(in srgb, var(--brand, #d7a14a) 55%, #e8c178)
        );
      }
      .gsp__thumb-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .gsp__qty-badge {
        position: absolute;
        top: -0.2rem;
        left: -0.2rem;
        z-index: 1;
        min-width: 1.1rem;
        height: 1.1rem;
        padding: 0 0.25rem;
        border-radius: 999px;
        background: #1b2230;
        color: #fff;
        font-size: 0.65rem;
        font-weight: 700;
        display: grid;
        place-items: center;
      }
      .gsp__meta {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }
      .gsp__meta strong {
        font-size: 0.9375rem;
      }
      .gsp__desc,
      .gsp__muted,
      .gsp__empty {
        font-size: 0.8125rem;
        color: #6b7280;
      }
      .gsp__price {
        font-size: 0.875rem;
      }
      .gsp__choice-hint {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1b2230;
      }
      .gsp__choice-rule {
        font-size: 0.75rem;
        font-weight: 550;
        color: color-mix(in srgb, var(--brand, #d7a14a) 70%, #a96f20);
      }
      .gsp__groups {
        margin-top: 0.35rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .gsp__group-line {
        margin: 0;
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        font-size: 0.7rem;
        font-weight: 600;
        color: #6b7280;
      }
      .gsp__opts {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
      }
      .gsp__opt {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.2rem 0.45rem;
        border-radius: 999px;
        border: 1px solid #e7e2db;
        font-size: 0.7rem;
        font-weight: 550;
      }
      .gsp__opt-img {
        width: 1.1rem;
        height: 1.1rem;
        border-radius: 4px;
        object-fit: cover;
      }
      .gsp__reassure {
        margin: 0 0 0.65rem;
        font-size: 0.8125rem;
        font-weight: 600;
        line-height: 1.4;
        color: #1b2230;
      }
      .gsp__add {
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        background: var(--brand, var(--leos-gold, #d7a14a));
        color: #fff;
        display: grid;
        place-items: center;
        font-size: 1.1rem;
        flex-shrink: 0;
        cursor: pointer;
      }
      .gsp__panel-title {
        margin: 0 0 0.5rem;
        font-size: 1.15rem;
        font-weight: 650;
      }
      .gsp__sample-line {
        display: flex;
        justify-content: space-between;
        padding: 0.85rem 0;
        border-bottom: 1px solid #e7e2db;
        font-size: 0.9375rem;
      }
      .gsp__status {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, var(--brand, #d7a14a) 12%, transparent);
        font-weight: 600;
      }
      .gsp__pay {
        margin-top: 1.25rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .gsp__pay span {
        padding: 0.35rem 0.65rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--brand, #d7a14a) 14%, transparent);
        color: color-mix(in srgb, var(--brand, #d7a14a) 55%, #1b2230);
        font-size: 0.75rem;
        font-weight: 600;
      }
      .gsp__dock {
        display: flex;
        border-top: 1px solid #e7e2db;
        background: #faf7f2;
        padding: 0.35rem 0.25rem calc(0.35rem + env(safe-area-inset-bottom, 0));
      }
      .gsp__dock button {
        flex: 1;
        border: none;
        background: transparent;
        padding: 0.65rem 0.25rem;
        font: inherit;
        font-size: 0.7rem;
        font-weight: 650;
        color: #6b7280;
        cursor: pointer;
      }
      .gsp__dock button.is-on {
        color: color-mix(in srgb, var(--brand, #d7a14a) 55%, #1b2230);
      }
      .gsp__dock-quiet {
        flex: 0.85;
        display: grid;
        place-items: center;
        padding: 0.65rem 0.15rem;
        font-size: 0.65rem;
        font-weight: 550;
        color: #9ca3af;
        user-select: none;
      }
    `,
  ],
})
export class GuestShellProjectionComponent {
  @Input({ required: true }) design!: GuestExperienceDesign;
  @Input() venueName = 'Blue Door';
  @Input() placeCode = '';
  @Input() greeting = 'Hi there';
  @Input() brandColour = '#d7a14a';
  @Input() logoUrl = '';
  /** Fill parent phone screen — never escape the desk frame. */
  @Input() fillFrame = false;
  /** @deprecated use fillFrame — kept so callers compile during migrate */
  @Input() set fullscreen(v: boolean) {
    if (v) this.fillFrame = true;
  }
  @Input() catalogueLabel = 'Menu';
  @Input() paymentLabel = 'Bill';
  @Input() placeNoun = 'Table';
  @Input() transactionLabel = 'Order';
  @Input() leaveLabel = 'Leave';
  @Input() sampleItemLabel = 'Classic Burger';
  @Input() experienceTypeId = 'restaurant';
  @Input() payMethods: { card: boolean; applePay: boolean; googlePay: boolean } = {
    card: false,
    applePay: false,
    googlePay: false,
  };
  @Input() showFoodImages = true;

  tab: PreviewTab = 'menu';
  categoryFilter = '';
  openChoiceId = '';
  previewQty: Record<string, number> = {};
  readonly choiceGroupHint = choiceGroupHint;

  get logoSrc(): string | null {
    return safeGuestImageUrl(this.logoUrl);
  }

  itemImage(url: string | undefined): string | null {
    return safeGuestImageUrl(url);
  }

  onCatalogueClick(event: Event) {
    const target = event.target as HTMLElement | null;
    const add = target?.closest('[data-add]');
    const row = target?.closest('[data-item]') as HTMLElement | null;
    if (!add || !row) return;
    const id = row.getAttribute('data-item');
    if (!id) return;
    if (row.getAttribute('data-has-choices') === 'true') {
      this.openChoiceId = this.openChoiceId === id ? '' : id;
      return;
    }
    this.previewQty = { ...this.previewQty, [id]: (this.previewQty[id] ?? 0) + 1 };
  }

  get canBrowse(): boolean {
    return !!(
      this.design.browseMenu ||
      this.design.orderFood ||
      this.design.drinks ||
      this.design.specials ||
      this.design.specialRequests ||
      this.design.book
    );
  }

  get showAdd(): boolean {
    return !!(this.design.orderFood || this.design.drinks || this.design.specialRequests);
  }

  get categoryChips(): string[] {
    return categoriesFromDesign(this.design, this.experienceTypeId);
  }

  get items() {
    return visibleProjectionItems(this.design, this.experienceTypeId);
  }

  get filteredItems() {
    if (!this.categoryFilter) return this.items;
    return this.items.filter((i) => i.category === this.categoryFilter);
  }

  get hasBillChrome(): boolean {
    return !!(
      this.payMethods.card ||
      this.payMethods.applePay ||
      this.payMethods.googlePay ||
      this.design.payAtTable ||
      this.design.splitBill ||
      this.design.tipStaff
    );
  }

  get payAtPlaceLabel(): string {
    return `Pay at ${this.placeNoun}`;
  }

  get transactionPlural(): string {
    const t = (this.transactionLabel || 'Order').trim() || 'Order';
    return /s$/i.test(t) ? t : `${t}s`;
  }

  get sampleVisitTotal(): string {
    const match = this.items.find((i) => i.label === this.sampleItemLabel);
    return match?.price ?? this.items[0]?.price ?? '—';
  }

  get orderCopy() {
    return projectionOrderCopy(this.experienceTypeId, 'preparing');
  }
}
