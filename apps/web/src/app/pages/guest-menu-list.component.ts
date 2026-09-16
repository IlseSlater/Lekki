import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuCardComponent } from '../leos/menu-card.component';
import {
  formatAllergenLine,
  formatDietaryLine,
} from '../studio/catalogue-guest-visibility';
import type { CatalogueItem } from '../services/guest-session.service';

export type GuestMenuSection = {
  category: string;
  items: CatalogueItem[];
};

/**
 * Dumb guest menu list — category sections + menu cards.
 * Smart container owns GuestSessionService; this component never injects it.
 */
@Component({
  selector: 'lekki-guest-menu-list',
  standalone: true,
  imports: [CommonModule, MenuCardComponent],
  template: `
    @for (section of sections; track section.category) {
      <section class="leos-menu-section" [attr.aria-label]="section.category">
        @if (showSectionTitles) {
          <h2 class="leos-menu-section__title">{{ section.category }}</h2>
        }
        <div class="leos-menu-grid leos-menu-grid--hero" role="list">
          @for (item of section.items; track item.id) {
            <leos-menu-card
              [label]="item.label"
              [category]="showSectionTitles ? '' : item.category"
              [unitPrice]="item.unitPrice"
              [description]="item.description || ''"
              [allergenLine]="allergenLine(item)"
              [dietaryLine]="dietaryLine(item)"
              [imageUrl]="item.imageUrl || null"
              [showFoodImages]="showFoodImages"
              [quantity]="qtyFor(item.id)"
              [requiresChoices]="requiresChoices(item)"
              (add)="selectItem.emit(item)"
              (quantityChange)="quantityChange.emit({ item, quantity: $event })"
              (remove)="removeItem.emit(item)"
            />
          }
        </div>
      </section>
    } @empty {
      @if (!catalogueLoading) {
        <div class="leos-empty">
          @if (catalogueEmpty) {
            <p class="leos-muted">Nothing is on the {{ catalogueNoun }} yet.</p>
            <p class="leos-muted">Ask a team member if this experience should already be live.</p>
          } @else {
            <p class="leos-muted">Nothing matches that.</p>
            <p class="leos-muted">Try another category or clear search.</p>
            <button
              type="button"
              class="leos-btn leos-btn--secondary"
              style="margin-top:0.75rem;"
              (click)="clearFilters.emit()"
            >
              Show everything
            </button>
          }
        </div>
      }
    }
  `,
})
export class GuestMenuListComponent {
  /** Filtered + grouped catalogue from the smart container. */
  @Input({ required: true }) sections!: GuestMenuSection[];
  /** Cart badge counts keyed by catalogue item id. */
  @Input() cartQuantities: Record<string, number> = {};
  @Input() showSectionTitles = false;
  @Input() showFoodImages = true;
  @Input() catalogueLoading = false;
  /** True when the venue catalogue has no items at all (vs filtered empty). */
  @Input() catalogueEmpty = false;
  @Input() catalogueNoun = 'menu';

  /** Primary item action — quick-add or open choices (container decides). */
  @Output() selectItem = new EventEmitter<CatalogueItem>();
  @Output() quantityChange = new EventEmitter<{ item: CatalogueItem; quantity: number }>();
  @Output() removeItem = new EventEmitter<CatalogueItem>();
  @Output() clearFilters = new EventEmitter<void>();

  qtyFor(itemId: string): number {
    return this.cartQuantities[itemId] ?? 0;
  }

  allergenLine(item: CatalogueItem): string {
    return formatAllergenLine(item.allergens);
  }

  dietaryLine(item: CatalogueItem): string {
    return formatDietaryLine(item.dietaryTags);
  }

  requiresChoices(item: CatalogueItem): boolean {
    return Array.isArray(item.choiceGroups) && item.choiceGroups.length > 0;
  }
}
