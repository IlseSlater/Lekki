import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { StudioWorkspaceComponent } from '../leos/studio-workspace.component';
import { CatalogueLiveService } from '../services/catalogue-live.service';
import { LeosApiService } from '../services/leos-api.service';
import { StudioContextService } from '../services/studio-context.service';
import { parseMenuList } from '../studio/menu-list-import';
import { getExperience } from '../studio/experience-registry';
import { catalogueEditorCopy } from '../studio/catalogue-lock';

type MenuItem = {
  id: string;
  label: string;
  description?: string | null;
  unitPrice: number;
  category: string;
  available?: boolean;
  routingTags?: string[];
  imageUrl?: string | null;
  allergens?: string[];
  dietaryTags?: string[];
  ageRestricted?: boolean;
};

type EditorMode = 'list' | 'edit';

/**
 * Studio Menu — what guests can order.
 * Dual-pane with live phone. Auto-save. Not a Setup step.
 */
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, ExperienceScreenComponent, StudioWorkspaceComponent],
  template: `
    <leos-studio-workspace>
      <leos-experience-screen [purpose]="purpose" [lead]="lead" help="" [showFooter]="false">
        <div config class="menu-editor">
          @if (!venueId) {
            <p class="menu-editor__hint">
              Finish Who you are so we know which venue this menu belongs to.
            </p>
            <a class="leos-btn leos-btn--primary" routerLink="/studio/setup/identity">Continue setup</a>
          } @else if (mode === 'list') {
            <p class="menu-editor__hint">{{ listHint }}</p>
            <ul class="menu-editor__list" role="list">
              @for (item of items; track item.id) {
                <li>
                  <button type="button" class="menu-editor__row" (click)="openEdit(item)">
                    <span class="menu-editor__row-main">
                      <strong>{{ item.label }}</strong>
                      <span class="menu-editor__meta">{{ item.category }} · R{{ priceLabel(item.unitPrice) }}</span>
                    </span>
                    @if (item.available === false) {
                      <span class="menu-editor__badge">Off</span>
                    }
                  </button>
                </li>
              }
            </ul>
            <div class="menu-editor__doors">
              <button type="button" class="leos-btn leos-btn--primary" (click)="startAdd()">
                {{ copy.addLabel }}
              </button>
              <button type="button" class="leos-btn leos-btn--secondary" (click)="pickImport()">
                Import a list
              </button>
              <input
                #listFile
                type="file"
                accept=".csv,text/csv,text/plain"
                hidden
                (change)="onImportFile($event)"
              />
            </div>
            @if (importStatus) {
              <p class="menu-editor__status" role="status">{{ importStatus }}</p>
            }
          } @else {
            <div class="leos-field">
              <span class="leos-field__label">Name <em class="leos-field__need">required</em></span>
              <input
                class="leos-field__input"
                name="label"
                [(ngModel)]="draft.label"
                (ngModelChange)="scheduleSave()"
                autocomplete="off"
              />
            </div>
            <div class="leos-field">
              <span class="leos-field__label">Price (R) <em class="leos-field__need">required</em></span>
              <input
                class="leos-field__input"
                name="price"
                type="number"
                min="0"
                step="0.01"
                [(ngModel)]="draft.unitPrice"
                (ngModelChange)="scheduleSave()"
              />
            </div>
            <div class="leos-field">
              <span class="leos-field__label">Category <em class="leos-field__need">optional</em></span>
              <input
                class="leos-field__input"
                name="category"
                [(ngModel)]="draft.category"
                (ngModelChange)="scheduleSave()"
                placeholder="Food, Drinks, Specials…"
              />
            </div>
            <div class="leos-field">
              <span class="leos-field__label">Short description <em class="leos-field__need">optional</em></span>
              <textarea
                class="leos-field__input"
                name="description"
                rows="2"
                [(ngModel)]="draft.description"
                (ngModelChange)="scheduleSave()"
              ></textarea>
            </div>
            <div class="leos-field">
              <span class="leos-field__label">Photo URL <em class="leos-field__need">optional</em></span>
              <input
                class="leos-field__input"
                name="imageUrl"
                [(ngModel)]="draft.imageUrl"
                (ngModelChange)="scheduleSave()"
                placeholder="https://…"
                autocomplete="off"
              />
            </div>
            <div class="leos-field">
              <span class="leos-field__label">Station <em class="leos-field__need">required</em></span>
              <select
                class="leos-field__input"
                name="station"
                [(ngModel)]="stationChoice"
                (ngModelChange)="onStation()"
              >
                <option value="food">Kitchen</option>
                <option value="beverage">Bar</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div class="leos-field">
              <span class="leos-field__label">Allergens <em class="leos-field__need">optional</em></span>
              <input
                class="leos-field__input"
                name="allergens"
                [(ngModel)]="allergensText"
                (ngModelChange)="scheduleSave()"
                placeholder="gluten, dairy…"
              />
            </div>
            <div class="leos-field">
              <span class="leos-field__label">Dietary tags <em class="leos-field__need">optional</em></span>
              <input
                class="leos-field__input"
                name="dietary"
                [(ngModel)]="dietaryText"
                (ngModelChange)="scheduleSave()"
                placeholder="vegan, vegetarian…"
              />
            </div>
            <label class="menu-editor__toggle">
              <input
                type="checkbox"
                [(ngModel)]="draft.available"
                (ngModelChange)="scheduleSave()"
              />
              <span>On the menu tonight</span>
            </label>
            <label class="menu-editor__toggle">
              <input
                type="checkbox"
                [(ngModel)]="draft.ageRestricted"
                (ngModelChange)="scheduleSave()"
              />
              <span>Adults only</span>
            </label>
            <p class="menu-editor__status" aria-live="polite">{{ saveStatus }}</p>
            <button type="button" class="leos-btn leos-btn--secondary" (click)="backToList()">
              Back to menu
            </button>
          }
        </div>
      </leos-experience-screen>
    </leos-studio-workspace>
  `,
  styles: [
    `
      .menu-editor {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .menu-editor__hint {
        margin: 0;
        color: var(--leos-ink-secondary, #64748b);
        font-size: 0.9375rem;
        line-height: 1.45;
      }
      .menu-editor__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .menu-editor__row {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        text-align: left;
        padding: 0.85rem 1rem;
        border: 1px solid var(--leos-border, #eae6e1);
        border-radius: 0.75rem;
        background: #fff;
        cursor: pointer;
      }
      .menu-editor__row-main {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .menu-editor__meta {
        font-size: 0.8125rem;
        color: var(--leos-ink-tertiary, #94a3b8);
      }
      .menu-editor__badge {
        font-size: 0.75rem;
        font-weight: 650;
        color: var(--leos-ink-secondary, #64748b);
      }
      .menu-editor__toggle {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.9375rem;
      }
      .menu-editor__status {
        margin: 0;
        min-height: 1.25rem;
        font-size: 0.8125rem;
        color: var(--leos-ink-tertiary, #94a3b8);
      }
      .menu-editor__doors {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
        align-items: center;
      }
    `,
  ],
})
export class StudioMenuPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(LeosApiService);
  private readonly ctx = inject(StudioContextService);
  private readonly catalogueLive = inject(CatalogueLiveService);

  @ViewChild('listFile') listFile?: ElementRef<HTMLInputElement>;

  venueId = '';
  mode: EditorMode = 'list';
  items: MenuItem[] = [];
  editingId: string | null = null;
  draft: {
    label: string;
    description: string;
    unitPrice: number;
    category: string;
    available: boolean;
    ageRestricted: boolean;
    routingTags: string[];
    imageUrl: string;
  } = this.emptyDraft();
  stationChoice = 'food';
  allergensText = '';
  dietaryText = '';
  saveStatus = '';
  importStatus = '';
  private saveTimer?: ReturnType<typeof setTimeout>;
  private creating = false;

  get itemNoun(): string {
    const typeId = this.ctx.activeExperience()?.typeId;
    return getExperience(typeId)?.terminology.item ?? 'Item';
  }

  get copy() {
    return catalogueEditorCopy({ itemNoun: this.itemNoun, count: this.items.length });
  }

  get defaultCategory(): string {
    const typeId = this.ctx.activeExperience()?.typeId;
    return getExperience(typeId)?.defaults.experienceCategories[0] ?? 'Food';
  }

  get purpose(): string {
    return this.mode === 'list' ? this.copy.purposeList : this.copy.purposeEdit;
  }

  get lead(): string {
    return this.mode === 'list'
      ? 'Changes appear on the phone as you save.'
      : 'Auto-saves. Guests see the phone update live.';
  }

  get listHint(): string {
    return this.copy.listHint;
  }

  ngOnInit() {
    const active = this.ctx.activeExperience();
    this.venueId = active?.venueId || '';
    if (this.venueId) this.reload();
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
  }

  priceLabel(n: number): string {
    return Number(n).toFixed(2).replace(/\.00$/, '');
  }

  openEdit(item: MenuItem) {
    this.editingId = item.id;
    this.draft = {
      label: item.label,
      description: item.description || '',
      unitPrice: Number(item.unitPrice),
      category: item.category,
      available: item.available !== false,
      ageRestricted: item.ageRestricted === true,
      routingTags: item.routingTags?.length ? [...item.routingTags] : ['food'],
      imageUrl: item.imageUrl || '',
    };
    this.stationChoice = this.stationFromTags(this.draft.routingTags);
    this.allergensText = (item.allergens || []).join(', ');
    this.dietaryText = (item.dietaryTags || []).join(', ');
    this.mode = 'edit';
    this.saveStatus = '';
  }

  startAdd() {
    this.editingId = null;
    this.draft = this.emptyDraft();
    this.stationChoice = 'food';
    this.allergensText = '';
    this.dietaryText = '';
    this.mode = 'edit';
    this.saveStatus = '';
  }

  pickImport() {
    this.listFile?.nativeElement.click();
  }

  async onImportFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.venueId) return;
    const text = await file.text();
    const rows = parseMenuList(text, this.defaultCategory);
    if (!rows.length) {
      this.importStatus = 'Nothing to import — use name, price, category.';
      return;
    }
    this.importStatus = `Importing ${rows.length}…`;
    try {
      for (const row of rows) {
        await firstValueFrom(
          this.api.createCatalogueItem(this.venueId, {
            label: row.label,
            unitPrice: row.unitPrice,
            category: row.category,
            available: true,
            routingTags: ['food'],
          }),
        );
      }
      this.catalogueLive.bump();
      this.reload();
      this.importStatus = `Imported ${rows.length}.`;
      setTimeout(() => (this.importStatus = ''), 3000);
    } catch {
      this.importStatus = 'Couldn’t import that list — try again.';
    }
  }

  backToList() {
    this.mode = 'list';
    this.editingId = null;
    this.reload();
  }

  onStation() {
    this.draft.routingTags = [this.stationChoice];
    this.scheduleSave();
  }

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveStatus = 'Saving…';
    this.saveTimer = setTimeout(() => this.persist(), 450);
  }

  private persist() {
    if (!this.venueId) return;
    const label = this.draft.label.trim();
    const category = this.draft.category.trim() || 'Food';
    if (!label || !(this.draft.unitPrice >= 0)) {
      this.saveStatus = 'Add a name and price to save.';
      return;
    }
    const body = {
      label,
      description: this.draft.description.trim(),
      unitPrice: Number(this.draft.unitPrice),
      category,
      available: this.draft.available,
      ageRestricted: this.draft.ageRestricted,
      routingTags: this.draft.routingTags.length ? this.draft.routingTags : ['food'],
      allergens: splitTags(this.allergensText),
      dietaryTags: splitTags(this.dietaryText),
      imageUrl: this.draft.imageUrl.trim(),
    };

    if (!this.editingId) {
      if (this.creating) return;
      this.creating = true;
      this.api.createCatalogueItem(this.venueId, body).subscribe({
        next: (created) => {
          this.creating = false;
          const row = created as MenuItem;
          this.editingId = row.id;
          this.saveStatus = 'Saved';
          this.catalogueLive.bump();
          this.reload(false);
        },
        error: () => {
          this.creating = false;
          this.saveStatus = 'Couldn’t save — try again.';
        },
      });
      return;
    }

    this.api.updateCatalogueItem(this.editingId, body).subscribe({
      next: () => {
        this.saveStatus = 'Saved';
        this.catalogueLive.bump();
        this.reload(false);
      },
      error: () => {
        this.saveStatus = 'Couldn’t save — try again.';
      },
    });
  }

  private reload(resetMode = true) {
    if (!this.venueId) return;
    this.api.getCatalogue(this.venueId).subscribe({
      next: (rows) => {
        this.items = rows as MenuItem[];
        if (resetMode) this.mode = 'list';
      },
      error: () => {
        this.saveStatus = 'Couldn’t load the menu.';
      },
    });
  }

  private emptyDraft() {
    return {
      label: '',
      description: '',
      unitPrice: 0,
      category: this.defaultCategory,
      available: true,
      ageRestricted: false,
      routingTags: ['food'],
      imageUrl: '',
    };
  }

  private stationFromTags(tags: string[]): string {
    if (tags.includes('beverage') || tags.includes('drinks')) return 'beverage';
    if (tags.includes('service')) return 'service';
    return 'food';
  }
}

function splitTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}
