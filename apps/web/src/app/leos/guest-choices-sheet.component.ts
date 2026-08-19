import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeosMoneyPipe } from './leos-money.pipe';
import { QuantityStepperComponent } from './quantity-stepper.component';
import { choiceGroupHint, safeGuestImageUrl } from './catalogue-parity';

export type CatalogChoiceOption = {
  id: string;
  label: string;
  priceDelta?: number;
  /** Optional thumbnail for option rows (Studio-configured). */
  imageUrl?: string;
};

export type CatalogChoiceGroup = {
  id: string;
  label: string;
  required: boolean;
  min?: number;
  max?: number;
  options: CatalogChoiceOption[];
};

export type ChoiceSheetResult = {
  quantity: number;
  unitPrice: number;
  choiceSummary: string;
  specialRequest: string;
  selections: Record<string, string[]>;
};

/**
 * G-04 — one sheet over Browse. Required first · Extras · Special requests · qty · Add.
 * No wizard. Guests never see “modifier”.
 */
@Component({
  selector: 'leos-guest-choices-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, LeosMoneyPipe, QuantityStepperComponent],
  template: `
    @if (open && itemLabel) {
      <div
        class="gcs"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <button
          type="button"
          class="gcs__backdrop"
          aria-label="Close choices"
          (click)="dismiss.emit()"
        ></button>
        <div class="gcs__panel">
          <header class="gcs__header">
            <div class="gcs__header-row">
              <h2 [id]="titleId" class="gcs__title">{{ itemLabel }}</h2>
              <button type="button" class="gcs__close" aria-label="Close" (click)="dismiss.emit()">
                ×
              </button>
            </div>
            <p class="gcs__base" aria-label="Base price">{{ basePrice | leosMoney: currency }}</p>
            @if (itemDescription) {
              <p class="gcs__desc">{{ itemDescription }}</p>
            }
          </header>

          <div class="gcs__body">
            @for (group of orderedGroups; track group.id) {
              <fieldset class="gcs__group">
                <legend class="gcs__legend">
                  <span class="gcs__legend-title">{{ group.label }}</span>
                  <span class="gcs__hint" [class.gcs__hint--required]="group.required">
                    {{ groupHint(group) }}
                  </span>
                </legend>

                <div class="gcs__options" role="list">
                  @for (opt of group.options; track opt.id) {
                    <button
                      type="button"
                      class="gcs__opt"
                      [class.gcs__opt--on]="isSelected(group.id, opt.id)"
                      [attr.aria-pressed]="isSelected(group.id, opt.id)"
                      (click)="toggle(group, opt.id)"
                    >
                      @if (showFoodImages && optionImage(opt.imageUrl)) {
                        <img class="gcs__opt-img" [src]="optionImage(opt.imageUrl)" [alt]="''" width="34" height="34" />
                      }
                      <span class="gcs__opt-label">{{ opt.label }}</span>
                      @if (opt.priceDelta) {
                        <span class="gcs__opt-delta">+{{ opt.priceDelta | leosMoney: currency }}</span>
                      }
                    </button>
                  }
                </div>
              </fieldset>
            }

            <label class="gcs__special">
              <span class="gcs__legend-title">Special requests</span>
              <textarea
                class="leos-field__input gcs__special-input"
                rows="2"
                maxlength="120"
                [(ngModel)]="specialRequest"
                placeholder="Anything we should know?"
              ></textarea>
            </label>

            @if (priceLines.length) {
              <div class="gcs__price-confidence" aria-live="polite">
                @for (line of priceLines; track line.label) {
                  <div class="gcs__price-line">
                    <span>{{ line.label }}</span>
                    <span>{{ line.amount | leosMoney: currency }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <footer class="gcs__footer">
            <leos-quantity-stepper
              [quantity]="quantity"
              [label]="itemLabel"
              (quantityChange)="quantity = $event"
            />
            <button
              type="button"
              class="leos-btn leos-btn--primary gcs__add"
              [disabled]="!canAdd"
              (click)="confirm()"
            >
              {{
                canAdd
                  ? confirmVerb + ' · ' + (lineTotal | leosMoney: currency)
                  : 'Choose required options'
              }}
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .gcs {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .gcs__backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(40, 28, 18, 0.35);
        cursor: pointer;
      }
      .gcs__panel {
        position: relative;
        display: flex;
        flex-direction: column;
        width: min(28rem, 100%);
        max-height: min(92vh, 40rem);
        overflow: hidden;
        border-radius: 1.25rem 1.25rem 0 0;
        background: var(--leos-surface, #f7f1e8);
      }
      .gcs__header {
        flex-shrink: 0;
        padding: 1.15rem 1.25rem 0.5rem;
      }
      .gcs__header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .gcs__close {
        flex-shrink: 0;
        width: 2.75rem;
        height: 2.75rem;
        margin: -0.35rem -0.45rem 0 0;
        border: 0;
        background: transparent;
        color: var(--leos-muted, #6b5c4d);
        font-size: 1.75rem;
        line-height: 1;
        cursor: pointer;
      }
      .gcs__title {
        margin: 0;
        font-family: var(--leos-font-display, Georgia, serif);
        font-size: 1.35rem;
        font-weight: 600;
        color: var(--leos-ink, #2c2416);
      }
      .gcs__base {
        margin: 0.25rem 0 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--leos-ink, #2c2416);
      }
      .gcs__desc {
        margin: 0.35rem 0 0;
        font-size: 0.875rem;
        color: var(--leos-neutral-muted, #6b7280);
      }

      .gcs__body {
        flex: 1;
        overflow: auto;
        padding: 0.5rem 1.25rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .gcs__group {
        margin: 0;
        padding: 0;
        border: 0;
        min-width: 0;
      }
      .gcs__legend {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.35rem;
      }
      .gcs__legend-title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--leos-ink, #2c2416);
      }
      .gcs__hint {
        font-size: 0.8125rem;
        font-weight: 650;
        color: var(--leos-neutral-muted, #6b7280);
        white-space: nowrap;
      }
      .gcs__hint--required {
        color: var(--leos-gold-dark, #a67a2e);
      }

      .gcs__options {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .gcs__opt {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.85rem 0.9rem;
        border-radius: 1rem;
        border: 1px solid rgba(42, 33, 24, 0.14);
        background: #fff;
        cursor: pointer;
        text-align: left;
      }
      .gcs__opt--on {
        border-color: color-mix(in srgb, var(--leos-gold, #d7a14a) 65%, transparent);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--leos-gold, #d7a14a) 18%, transparent);
      }
      .gcs__opt-img {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        object-fit: cover;
        flex-shrink: 0;
        background: var(--leos-warm-sand, #efe8dc);
      }
      .gcs__opt-label {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--leos-ink, #2c2416);
        flex: 1 1 auto;
        min-width: 0;
      }
      .gcs__opt-delta {
        font-size: 0.8125rem;
        color: var(--leos-neutral-muted, #6b7280);
        white-space: nowrap;
      }

      .gcs__special {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .gcs__special-input {
        resize: vertical;
        min-height: 2.5rem;
      }

      .gcs__price-confidence {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.8125rem;
        color: var(--leos-neutral-muted, #6b7280);
      }
      .gcs__price-line {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      .gcs__footer {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
        border-top: 1px solid var(--leos-warm-sand-dark, #e7e2db);
        background: color-mix(in srgb, var(--leos-surface, #f7f1e8) 92%, #fff);
      }
      .gcs__add {
        flex: 1 1 auto;
        min-width: 0;
        width: auto;
      }
    `,
  ],
})
export class GuestChoicesSheetComponent implements OnChanges {
  @Input() open = false;
  @Input() itemLabel = '';
  @Input() itemDescription = '';
  @Input() basePrice = 0;
  @Input() currency = 'ZAR';
  @Input() groups: CatalogChoiceGroup[] = [];
  @Input() showFoodImages = true;

  /** When set, sheet is editing an existing cart line. */
  @Input() confirmVerb = 'Add';
  @Input() editQuantity: number | null = null;
  @Input() editSpecialRequest = '';
  @Input() editSelections: Record<string, string[]> | null = null;

  @Output() dismiss = new EventEmitter<void>();
  @Output() add = new EventEmitter<ChoiceSheetResult>();

  readonly titleId = 'gcs-title';
  quantity = 1;
  specialRequest = '';
  /** groupId → selected option ids */
  private selected: Record<string, string[]> = {};

  optionImage(url: string | undefined): string | null {
    return this.showFoodImages ? safeGuestImageUrl(url) : null;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] || changes['groups'] || changes['itemLabel']) {
      if (this.open) {
        this.quantity = Math.max(1, this.editQuantity ?? 1);
        this.specialRequest = this.editSpecialRequest ?? '';
        this.selected = {};
        for (const g of this.groups) {
          this.selected[g.id] = [...(this.editSelections?.[g.id] ?? [])];
        }
      }
    }
  }

  get orderedGroups(): CatalogChoiceGroup[] {
    return [...this.groups].sort((a, b) => Number(b.required) - Number(a.required));
  }

  groupHint(group: CatalogChoiceGroup): string {
    return choiceGroupHint(group);
  }

  isSelected(groupId: string, optionId: string): boolean {
    return (this.selected[groupId] ?? []).includes(optionId);
  }

  toggle(group: CatalogChoiceGroup, optionId: string) {
    const max = group.max ?? (group.required ? 1 : 1);
    const cur = [...(this.selected[group.id] ?? [])];
    const idx = cur.indexOf(optionId);
    if (idx >= 0) {
      cur.splice(idx, 1);
    } else if (max <= 1) {
      cur.splice(0, cur.length, optionId);
    } else if (cur.length < max) {
      cur.push(optionId);
    } else {
      cur.shift();
      cur.push(optionId);
    }
    this.selected[group.id] = cur;
  }

  get canAdd(): boolean {
    return this.groups.every((g) => {
      const min = g.min ?? (g.required ? 1 : 0);
      return (this.selected[g.id] ?? []).length >= min;
    });
  }

  get priceLines(): Array<{ label: string; amount: number }> {
    const lines: Array<{ label: string; amount: number }> = [{ label: this.itemLabel || 'Item', amount: this.basePrice }];
    for (const g of this.orderedGroups) {
      for (const id of this.selected[g.id] ?? []) {
        const opt = g.options.find((o) => o.id === id);
        if (opt?.priceDelta) lines.push({ label: opt.label, amount: opt.priceDelta });
      }
    }
    return lines.length > 1 ? lines : [];
  }

  get unitPrice(): number {
    let total = this.basePrice;
    for (const g of this.groups) {
      for (const id of this.selected[g.id] ?? []) {
        const opt = g.options.find((o) => o.id === id);
        if (opt?.priceDelta) total += opt.priceDelta;
      }
    }
    return Math.round(total * 100) / 100;
  }

  get lineTotal(): number {
    return Math.round(this.unitPrice * Math.max(1, this.quantity) * 100) / 100;
  }

  confirm() {
    if (!this.canAdd) return;

    const parts: string[] = [];
    for (const g of this.orderedGroups) {
      const labels = (this.selected[g.id] ?? [])
        .map((id) => g.options.find((o) => o.id === id)?.label)
        .filter((x): x is string => !!x);
      if (!labels.length) continue;
      parts.push(`${this.groupShortLabel(g.label)}: ${labels.join(', ')}`);
    }
    const note = this.specialRequest.trim();
    if (note) parts.push(note);

    this.add.emit({
      quantity: Math.max(1, this.quantity),
      unitPrice: this.unitPrice,
      choiceSummary: parts.join('\n'),
      specialRequest: note,
      selections: Object.fromEntries(Object.entries(this.selected).map(([id, opts]) => [id, [...opts]])),
    });
  }

  private groupShortLabel(label: string): string {
    let word = label.trim().replace(/^choose your\s+/i, '').replace(/^choose\s+/i, '').trim();
    if (!word) word = label.trim();
    if (/^sides$/i.test(word)) word = 'Side';
    if (/^drinks$/i.test(word)) word = 'Drink';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
}

