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
import { withBusy, withHours, type PaceSettings } from '../leos/kitchen-pace-view';
import { soldOutLabel } from '../studio/order-actions';

type MenuItem = {
  id: string;
  label: string;
  description?: string | null;
  unitPrice: number;
  category: string;
  available?: boolean;
  /** When off: back 'tomorrow' by itself, or only when 'changed'. */
  soldOutUntil?: 'tomorrow' | 'changed' | null;
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
              Finish Your place so we know which venue this menu belongs to.
            </p>
            <a class="leos-btn leos-btn--primary" routerLink="/studio/setup/identity">Continue setup</a>
          } @else if (mode === 'list') {
            <p class="menu-editor__hint">{{ listHint }}</p>
            <button type="button" class="leos-btn leos-btn--primary menu-editor__add" (click)="startAdd()">
              + {{ items.length ? 'Add a dish' : 'Add the first dish' }}
            </button>
            <div class="menu-editor__doors">
              <button type="button" class="menu-editor__pill" (click)="pickImport()">Import a list</button>
              <input
                #listFile
                type="file"
                accept=".csv,text/csv,text/plain"
                hidden
                (change)="onImportFile($event)"
              />
              @if (importStatus) {
                <span class="menu-editor__status" role="status">{{ importStatus }}</span>
              }
            </div>
            <ul class="menu-editor__list" role="list">
              @for (item of items; track item.id) {
                <li class="menu-editor__card" [class.menu-editor__card--off]="item.available === false">
                  <button type="button" class="menu-editor__row" (click)="openEdit(item)">
                    <span class="menu-editor__row-main">
                      <strong>{{ item.label }}</strong>
                      <span class="menu-editor__meta">{{ item.category }} · R{{ priceLabel(item.unitPrice) }}</span>
                      @if (item.available === false) {
                        <span class="menu-editor__meta">{{ offLabel(item) }}</span>
                      }
                    </span>
                  </button>
                  <button
                    type="button"
                    class="menu-editor__switch"
                    role="switch"
                    [attr.aria-checked]="item.available !== false"
                    [attr.aria-expanded]="item.available !== false ? choosingOffId === item.id : null"
                    [attr.aria-label]="item.label + ' on the menu tonight'"
                    (click)="toggleAvailable(item)"
                  ></button>
                  @if (choosingOffId === item.id) {
                    <div class="menu-editor__off" role="group" [attr.aria-label]="'Take ' + item.label + ' off'">
                      <button type="button" class="menu-editor__pill" (click)="takeOff(item, 'today')">Off today</button>
                      <button type="button" class="menu-editor__pill" (click)="takeOff(item, 'until_changed')">
                        Until I change it
                      </button>
                      <button type="button" class="menu-editor__pill" (click)="choosingOffId = ''">Keep it on</button>
                    </div>
                  }
                </li>
              }
            </ul>
            @if (pace && paceCategories.length) {
              <details class="menu-editor__pace menu-editor__panel">
                <summary>Kitchen pace</summary>
                <p class="menu-editor__hint">
                  Set when a category is served and how long guests wait. Leave a time empty to serve it all day.
                </p>
                @for (cat of paceCategories; track cat) {
                  <div class="menu-editor__pace-row">
                    <strong>{{ cat }}</strong>
                    <label>
                      <span>From</span>
                      <input
                        type="time"
                        class="leos-field__input"
                        [ngModel]="hoursFor(cat, 'from')"
                        (ngModelChange)="paceHours(cat, 'from', $event)"
                      />
                    </label>
                    <label>
                      <span>Until</span>
                      <input
                        type="time"
                        class="leos-field__input"
                        [ngModel]="hoursFor(cat, 'to')"
                        (ngModelChange)="paceHours(cat, 'to', $event)"
                      />
                    </label>
                    <label>
                      <span>Busy minutes</span>
                      <input
                        type="number"
                        min="0"
                        max="240"
                        class="leos-field__input"
                        [ngModel]="pace.busyMinutes[cat] || null"
                        (ngModelChange)="paceBusy(cat, $event)"
                      />
                    </label>
                  </div>
                }
                @if (hasBusyMinutes) {
                  <div class="menu-editor__pace-row">
                    <label>
                      <span>Busy minutes last</span>
                      <select
                        class="leos-field__input"
                        [ngModel]="busyForMinutes"
                        (ngModelChange)="setBusyFor($event)"
                      >
                        <option [ngValue]="null">Until I clear them</option>
                        <option [ngValue]="60">1 hour</option>
                        <option [ngValue]="120">2 hours</option>
                        <option [ngValue]="240">4 hours</option>
                      </select>
                    </label>
                    @if (busyUntilLabel) {
                      <span class="menu-editor__closed-note">{{ busyUntilLabel }}</span>
                    }
                  </div>
                }
                <label class="menu-editor__toggle">
                  <input
                    type="checkbox"
                    [ngModel]="pace.holdRounds"
                    (ngModelChange)="paceHold($event)"
                  />
                  <span>Send each round to the kitchen together</span>
                </label>
                <div class="menu-editor__closed">
                  <strong>Closed days</strong>
                  <p class="menu-editor__closed-note">
                    On these days guests can still see and pay a bill, but can’t order.
                  </p>
                  @for (d of pace.closedDates ?? []; track d.date) {
                    <div class="menu-editor__closed-row">
                      <span>{{ d.date }}@if (d.note) { · {{ d.note }} }</span>
                      <button type="button" class="menu-editor__pill" (click)="removeClosedDay(d.date)">Remove</button>
                    </div>
                  }
                  <div class="menu-editor__pace-row">
                    <label>
                      <span>Date</span>
                      <input type="date" class="leos-field__input" [(ngModel)]="newClosedDate" />
                    </label>
                    <label>
                      <span>Note (optional)</span>
                      <input class="leos-field__input" maxlength="80" [(ngModel)]="newClosedNote" placeholder="Public holiday" />
                    </label>
                    <button type="button" class="menu-editor__pill" [disabled]="!newClosedDate" (click)="addClosedDay()">
                      Add closed day
                    </button>
                  </div>
                </div>
                <p class="menu-editor__status" aria-live="polite">{{ paceStatus }}</p>
              </details>
            }
          } @else {
            <button type="button" class="menu-editor__pill menu-editor__back" (click)="backToList()">
              ‹ Back to menu
            </button>
            <div class="menu-editor__panel">
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
            </div>
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
      .menu-editor__add {
        width: 100%;
      }
      .menu-editor__pill {
        align-self: flex-start;
        min-height: 2.25rem;
        padding: 0.35rem 0.95rem;
        border: 1px solid var(--studio-line, var(--leos-border));
        border-radius: 999px;
        background: var(--studio-surface, var(--leos-surface));
        color: var(--studio-ink, var(--leos-ink));
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
      }
      .menu-editor__pill:hover {
        background: var(--studio-surface-secondary, var(--leos-surface-secondary));
      }
      .menu-editor__back {
        margin-bottom: -0.25rem;
      }
      .menu-editor__panel {
        display: grid;
        gap: 1rem;
        padding: 1.25rem 1.5rem;
        background: var(--studio-surface, var(--leos-surface));
        border: 1px solid var(--studio-line, var(--leos-border));
        border-radius: var(--studio-radius, 16px);
        box-shadow: var(--studio-shadow);
      }
      .menu-editor__panel .leos-field + .leos-field {
        margin-top: 0;
      }
      .menu-editor__card {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        padding-right: 1.1rem;
        background: var(--studio-surface, var(--leos-surface));
        border: 1px solid var(--studio-line, var(--leos-border));
        border-radius: var(--studio-radius, 16px);
        box-shadow: var(--studio-shadow);
        transition: box-shadow 160ms var(--studio-ease, ease);
      }
      .menu-editor__card:hover {
        box-shadow: var(--studio-shadow-hover);
      }
      .menu-editor__card--off .menu-editor__row {
        opacity: 0.55;
      }
      .menu-editor__row {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        text-align: left;
        padding: 1.05rem 0 1.05rem 1.25rem;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }
      .menu-editor__switch {
        position: relative;
        flex: 0 0 auto;
        width: 2.5rem;
        height: 1.5rem;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: var(--studio-ink-tertiary, var(--leos-ink-tertiary));
        cursor: pointer;
        transition: background 160ms var(--studio-ease, ease);
      }
      .menu-editor__switch::after {
        content: '';
        position: absolute;
        top: 0.15rem;
        left: 0.15rem;
        width: 1.2rem;
        height: 1.2rem;
        border-radius: 999px;
        background: var(--studio-surface, var(--leos-surface));
        transition: transform 160ms var(--studio-ease, ease);
      }
      .menu-editor__switch[aria-checked='true'] {
        background: var(--studio-success, var(--leos-success));
      }
      .menu-editor__switch[aria-checked='true']::after {
        transform: translateX(1rem);
      }
      .menu-editor__switch:focus-visible {
        outline: 2px solid var(--studio-ink, var(--leos-ink));
        outline-offset: 2px;
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
      .menu-editor__pace {
        display: grid;
        gap: 0.75rem;
      }
      .menu-editor__pace summary {
        cursor: pointer;
        font-weight: 600;
      }
      .menu-editor__off {
        flex-basis: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        padding: 0 1rem 0.75rem;
      }
      .menu-editor__closed {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .menu-editor__closed-note {
        margin: 0;
        font-size: 0.85rem;
        color: #475569;
      }
      .menu-editor__closed-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.9rem;
      }
      .menu-editor__pace-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
        gap: 0.5rem;
        align-items: end;
      }
      .menu-editor__pace-row strong {
        grid-column: 1 / -1;
      }
      .menu-editor__pace-row label {
        display: grid;
        gap: 0.2rem;
        font-size: 0.8125rem;
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
  private starterTried = false;

  pace: PaceSettings | null = null;
  paceStatus = '';
  private paceTimer?: ReturnType<typeof setTimeout>;

  get paceCategories(): string[] {
    return [...new Set(this.items.map((i) => i.category).filter(Boolean))].sort();
  }

  private loadPace() {
    this.api.getPace(this.venueId).subscribe({
      next: (p) => (this.pace = p),
      error: () => (this.pace = null),
    });
  }

  hoursFor(category: string, edge: 'from' | 'to'): string {
    const cur = this.pace?.categoryHours[category] as { from: string; to: string } | undefined;
    return cur ? cur[edge] : '';
  }

  paceHours(category: string, edge: 'from' | 'to', value: string) {
    if (!this.pace) return;
    const from = edge === 'from' ? value : this.hoursFor(category, 'from');
    const to = edge === 'to' ? value : this.hoursFor(category, 'to');
    this.pace = withHours(this.pace, category, from, to);
    this.savePaceSoon();
  }

  paceBusy(category: string, minutes: number | null) {
    if (!this.pace) return;
    this.pace = withBusy(this.pace, category, minutes);
    this.savePaceSoon();
  }

  paceHold(on: boolean) {
    if (!this.pace) return;
    this.pace = { ...this.pace, holdRounds: !!on };
    this.savePaceSoon();
  }

  /** The length picked this visit; the saved end time is shown beside it. */
  busyForMinutes: number | null = null;

  get hasBusyMinutes(): boolean {
    return !!this.pace && Object.values(this.pace.busyMinutes ?? {}).some((m) => m > 0);
  }

  get busyUntilLabel(): string {
    const until = this.pace?.busyUntil;
    if (!until) return '';
    const t = Date.parse(until);
    return Number.isFinite(t)
      ? `Busy minutes stop at ${new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
      : '';
  }

  /** Busy minutes for a while, then the kitchen is back to normal by itself. */
  setBusyFor(minutes: number | null) {
    if (!this.pace) return;
    this.busyForMinutes = minutes;
    this.pace = {
      ...this.pace,
      busyUntil: minutes ? new Date(Date.now() + minutes * 60_000).toISOString() : null,
    };
    this.savePaceSoon();
  }

  newClosedDate = '';
  newClosedNote = '';

  addClosedDay() {
    if (!this.pace || !/^\d{4}-\d{2}-\d{2}$/.test(this.newClosedDate)) return;
    const rest = (this.pace.closedDates ?? []).filter((d) => d.date !== this.newClosedDate);
    this.pace = {
      ...this.pace,
      closedDates: [...rest, { date: this.newClosedDate, note: this.newClosedNote.trim() }].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
    this.newClosedDate = '';
    this.newClosedNote = '';
    this.savePaceSoon();
  }

  removeClosedDay(date: string) {
    if (!this.pace) return;
    this.pace = { ...this.pace, closedDates: (this.pace.closedDates ?? []).filter((d) => d.date !== date) };
    this.savePaceSoon();
  }

  private savePaceSoon() {
    this.paceStatus = 'Saving…';
    if (this.paceTimer) clearTimeout(this.paceTimer);
    this.paceTimer = setTimeout(() => {
      if (!this.pace) return;
      this.api.savePace(this.pace, this.venueId).subscribe({
        next: (p) => {
          this.pace = p;
          this.paceStatus = 'Saved';
        },
        error: () => (this.paceStatus = 'Couldn’t save — try again.'),
      });
    }, 600);
  }

  get purpose(): string {
    return this.mode === 'list' ? 'What can guests order?' : 'Tell guests about this dish';
  }

  get lead(): string {
    return this.mode === 'list'
      ? 'Changes appear on the phone as you save.'
      : 'Auto-saves. Guests see the phone update live.';
  }

  get listHint(): string {
    return this.items.length
      ? 'Tap a dish to change it — or mark what’s off tonight.'
      : 'Add a priced dish so guests can order — complimentary items can sit beside it.';
  }

  ngOnInit() {
    const active = this.ctx.activeExperience();
    this.venueId = active?.venueId || '';
    if (this.venueId) {
      this.reload();
      this.loadPace();
    }
  }

  ngOnDestroy() {
    if (this.paceTimer) clearTimeout(this.paceTimer);
    if (this.saveTimer) clearTimeout(this.saveTimer);
  }

  priceLabel(n: number): string {
    return Number(n).toFixed(2).replace(/\.00$/, '');
  }

  /** Which dish is asking "off today, or until I change it?". */
  choosingOffId = '';

  offLabel(item: MenuItem): string {
    return soldOutLabel({ available: item.available !== false, soldOutUntil: item.soldOutUntil });
  }

  /** Off asks for how long; back on is one tap. The phone follows. */
  toggleAvailable(item: MenuItem) {
    if (item.available !== false) {
      this.choosingOffId = this.choosingOffId === item.id ? '' : item.id;
      return;
    }
    this.setAvailability(item, 'back');
  }

  takeOff(item: MenuItem, mode: 'today' | 'until_changed') {
    this.choosingOffId = '';
    this.setAvailability(item, mode);
  }

  private setAvailability(item: MenuItem, mode: 'today' | 'until_changed' | 'back') {
    const before = { available: item.available, soldOutUntil: item.soldOutUntil };
    item.available = mode === 'back';
    item.soldOutUntil = mode === 'today' ? 'tomorrow' : mode === 'until_changed' ? 'changed' : null;
    this.api.setItemAvailability(item.id, mode).subscribe({
      next: () => this.catalogueLive.bump(),
      error: () => {
        item.available = before.available;
        item.soldOutUntil = before.soldOutUntil;
        this.importStatus = 'Couldn’t change that dish — try again.';
      },
    });
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
    const rows = parseMenuList(text);
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
        if (!rows.length && !this.starterTried) this.seedStarter();
      },
      error: () => {
        this.saveStatus = 'Couldn’t load the menu.';
      },
    });
  }

  /** First visit with no dishes: start from a short list the owner can correct. */
  private seedStarter() {
    if (!this.venueId) return;
    this.starterTried = true;
    const typeId = this.ctx.activeExperience()?.typeId;
    this.api.seedStarterMenu(this.venueId, typeId).subscribe({
      next: (res) => {
        if (res.seeded > 0) {
          this.catalogueLive.bump();
          this.reload(false);
        }
      },
      error: () => undefined,
    });
  }

  private emptyDraft() {
    return {
      label: '',
      description: '',
      unitPrice: 0,
      category: 'Food',
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
