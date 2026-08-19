import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { SETUP_STEPS, getExperience } from '../studio/experience-registry';
import {
  defaultPlaceSections,
  enabledPlaces,
  generateNumberedPlaces,
  newPlace,
  newSection,
  placeCodesFromSections,
  type PlaceSection,
} from '../studio/place-sections';
import { StudioContextService } from '../services/studio-context.service';

/** Setup — Where guests join. Signature: selecting a place changes arrival in the phone. */
@Component({
  standalone: true,
  imports: [FormsModule, ExperienceScreenComponent, RouterLink, ConfidenceIndicatorComponent],
  template: `
    <leos-experience-screen [purpose]="purpose" [lead]="lead" help="" [showFooter]="true">
      <div config class="pl-edit">
        @if (savedFlash) {
          <p class="studio-autosave" role="status">Saved automatically</p>
        }

        @for (section of sections; track section.id) {
          <section class="pl-section">
            <div class="pl-section__head">
              <input
                class="pl-section__name"
                [ngModel]="section.name"
                (ngModelChange)="renameSection(section.id, $event)"
                [attr.aria-label]="'Section name'"
              />
              <button
                type="button"
                class="pl-link"
                (click)="removeSection(section.id)"
                [disabled]="sections.length <= 1"
              >
                Remove
              </button>
            </div>
            <ul class="pl-list">
              @for (place of section.places; track place.id) {
                <li>
                  <label class="pl-row" [class.pl-row--selected]="selectedLabel === place.label">
                    <input
                      type="checkbox"
                      [checked]="place.enabled"
                      (change)="togglePlace(section.id, place.id, $event)"
                    />
                    <button type="button" class="pl-row__label" (click)="selectPlace(place.label)">
                      {{ place.label }}
                    </button>
                  </label>
                </li>
              }
            </ul>
            <button type="button" class="pl-link" (click)="addPlaceToSection(section.id)">
              + Add {{ singularNoun.toLowerCase() }}
            </button>
          </section>
        }

        <div class="pl-actions">
          <button type="button" class="pl-link" (click)="addSection()">+ Add section</button>
        </div>

        <div class="pl-bulk">
          <p class="pl-bulk__title">Create {{ placeNounPlural.toLowerCase() }} 1–20</p>
          <div class="pl-bulk__row">
            <label class="pl-bulk__grow">
              Section
              <input
                class="leos-field__input"
                [(ngModel)]="bulkSectionName"
                [placeholder]="defaultSectionName"
              />
            </label>
            <label>
              Count
              <input
                class="leos-field__input"
                type="number"
                [(ngModel)]="bulkCount"
                min="1"
                max="20"
              />
            </label>
            <button type="button" class="pl-link pl-link--action" (click)="createSectionWithCount()">
              Create
            </button>
          </div>
        </div>
      </div>

      <leos-confidence-indicator
        confidence
        eyebrow="Guests will join"
        [fact]="placesFact"
        [detail]="selectedLabel ? 'Selected · ' + selectedLabel : ''"
        [ready]="readyCount > 0"
        okLabel="Looks good"
        waiting="Enable at least one place guests can scan"
      />

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/setup/experience">Back</a>
      <button
        primary
        type="button"
        class="leos-btn leos-btn--primary"
        [disabled]="!readyCount"
        (click)="looksGood()"
      >
        Continue
      </button>
    </leos-experience-screen>
  `,
  styles: [
    `
      .pl-section {
        margin-bottom: var(--studio-pad-section, 40px);
        padding-bottom: var(--studio-gap-controls, 20px);
      }
      .pl-section__head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: var(--studio-gap-labels, 8px);
      }
      .pl-section__name {
        flex: 1;
        border: none;
        background: transparent;
        font: inherit;
        font-size: 1.05rem;
        font-weight: 650;
        color: var(--studio-ink, #1b2230);
        padding: 0;
      }
      .pl-link {
        border: none;
        background: transparent;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-ink-secondary, #6b7280);
        cursor: pointer;
        padding: 0;
      }
      .pl-link:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .pl-link--action {
        min-height: 2.75rem;
        padding: 0 0.25rem;
        color: var(--studio-ink, #1b2230);
        font-weight: 600;
        align-self: end;
      }
      .pl-list {
        list-style: none;
        margin: 0 0 0.75rem;
        padding: 0;
      }
      .pl-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.55rem 0;
        border-bottom: 1px solid var(--studio-line, #e7e2db);
        cursor: pointer;
      }
      .pl-row--selected .pl-row__label {
        font-weight: 650;
        color: var(--studio-ink, #1b2230);
      }
      .pl-row__label {
        border: none;
        background: transparent;
        font: inherit;
        font-size: 0.9375rem;
        color: var(--studio-ink-secondary, #6b7280);
        cursor: pointer;
        padding: 0;
        text-align: left;
      }
      .pl-actions {
        margin-bottom: var(--studio-gap-controls, 20px);
      }
      .pl-bulk {
        padding-top: var(--studio-gap-controls, 20px);
      }
      .pl-bulk__title {
        margin: 0 0 var(--studio-gap-labels, 8px);
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .pl-bulk__row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--studio-gap-controls, 20px);
        align-items: flex-end;
        margin-bottom: var(--studio-gap-controls, 20px);
      }
      .pl-bulk__row label {
        display: flex;
        flex-direction: column;
        gap: var(--studio-gap-labels, 8px);
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .pl-bulk__row input {
        width: 5rem;
        min-height: 2.4rem;
      }
      .pl-bulk__grow {
        flex: 1;
        min-width: 8rem;
      }
      .pl-bulk__grow input {
        width: 100%;
      }
    `,
  ],
})
export class SetupPlacesPageComponent implements OnInit, OnDestroy {
  private readonly ctx = inject(StudioContextService);
  private readonly router = inject(Router);
  private saveTimer?: ReturnType<typeof setTimeout>;
  private flashTimer?: ReturnType<typeof setTimeout>;

  purpose = SETUP_STEPS[2].title;
  lead = SETUP_STEPS[2].why;
  singularNoun = 'Table';
  placeNounPlural = 'Tables';
  defaultSectionName = 'Main Dining';
  sections: PlaceSection[] = [];
  selectedLabel = '';
  savedFlash = false;

  bulkSectionName = '';
  bulkCount = 20;

  get readyCount() {
    return enabledPlaces(this.sections).length;
  }

  get placesFact() {
    const n = this.readyCount;
    if (!n) return 'No places ready';
    const noun = n === 1 ? this.singularNoun.toLowerCase() : this.placeNounPlural.toLowerCase();
    return `${n} ${noun} ready`;
  }

  ngOnInit() {
    const active = this.ctx.activeExperience();
    if (!active) {
      void this.router.navigate(['/studio/create']);
      return;
    }
    const def = getExperience(active.typeId);
    this.singularNoun = def?.terminology.place ?? 'Place';
    this.placeNounPlural = def?.defaults.placeLabel ?? `${this.singularNoun}s`;
    this.defaultSectionName =
      active.typeId === 'cafe'
        ? 'Pickup Counter'
        : active.typeId === 'hotel'
          ? 'Rooms'
          : 'Main Dining';
    this.bulkSectionName = this.defaultSectionName;
    this.sections = active.placeSections?.length
      ? structuredClone(active.placeSections)
      : defaultPlaceSections(active.typeId);
    const enabled = enabledPlaces(this.sections);
    this.selectedLabel =
      enabled.find((p) => p.label === active.placeCode)?.label ?? enabled[0]?.label ?? '';
    this.ctx.setLiveFocusPlace(this.selectedLabel || null);
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.flashTimer) clearTimeout(this.flashTimer);
  }

  selectPlace(label: string) {
    this.selectedLabel = label;
    this.ctx.setLiveFocusPlace(label);
    this.scheduleSave();
  }

  togglePlace(sectionId: string, placeId: string, ev: Event) {
    const on = (ev.target as HTMLInputElement).checked;
    this.sections = this.sections.map((s) =>
      s.id !== sectionId
        ? s
        : {
            ...s,
            places: s.places.map((p) => (p.id === placeId ? { ...p, enabled: on } : p)),
          },
    );
    if (!on && this.selectedLabel) {
      const still = enabledPlaces(this.sections).find((p) => p.label === this.selectedLabel);
      if (!still) this.selectedLabel = enabledPlaces(this.sections)[0]?.label ?? '';
    }
    this.ctx.setLiveFocusPlace(this.selectedLabel || null);
    this.scheduleSave();
  }

  renameSection(sectionId: string, name: string) {
    this.sections = this.sections.map((s) => (s.id === sectionId ? { ...s, name } : s));
    this.scheduleSave();
  }

  addPlaceToSection(sectionId: string) {
    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const n = section.places.length + 1;
    const label = `${this.singularNoun} ${n}`;
    this.sections = this.sections.map((s) =>
      s.id !== sectionId ? s : { ...s, places: [...s.places, newPlace(label)] },
    );
    this.selectedLabel = label;
    this.ctx.setLiveFocusPlace(label);
    this.scheduleSave();
  }

  addSection() {
    const name = `Section ${this.sections.length + 1}`;
    this.sections = [...this.sections, newSection(name, [newPlace(`${this.singularNoun} 1`)])];
    this.scheduleSave();
  }

  removeSection(sectionId: string) {
    if (this.sections.length <= 1) return;
    this.sections = this.sections.filter((s) => s.id !== sectionId);
    const enabled = enabledPlaces(this.sections);
    if (!enabled.some((p) => p.label === this.selectedLabel)) {
      this.selectedLabel = enabled[0]?.label ?? '';
    }
    this.ctx.setLiveFocusPlace(this.selectedLabel || null);
    this.scheduleSave();
  }

  createSectionWithCount() {
    const count = Math.min(20, Math.max(1, Number(this.bulkCount) || 1));
    const name = (this.bulkSectionName || this.defaultSectionName).trim();
    const places = generateNumberedPlaces(this.singularNoun, 1, count);
    this.sections = [...this.sections, newSection(name, places)];
    this.selectedLabel = places[0]?.label ?? this.selectedLabel;
    this.ctx.setLiveFocusPlace(this.selectedLabel || null);
    this.scheduleSave();
  }

  looksGood() {
    this.persist(true);
    void this.router.navigate(['/studio/setup/payments']);
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persist(false), 280);
  }

  private persist(markDone: boolean) {
    const codes = placeCodesFromSections(this.sections);
    const selected = codes.includes(this.selectedLabel) ? this.selectedLabel : codes[0] ?? '';
    this.selectedLabel = selected;
    this.ctx.setLiveFocusPlace(selected || null);
    this.ctx.upsertActive({
      placeSections: structuredClone(this.sections),
      placeCodes: codes,
      placeCode: selected,
    });
    if (markDone) this.ctx.markStep('places');
    this.savedFlash = true;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.savedFlash = false;
    }, 1800);
  }
}
