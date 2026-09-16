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
          <section class="pl-room">
            <header class="pl-room__head">
              <input
                class="pl-room__name"
                [attr.aria-label]="'Section name'"
                [ngModel]="section.name"
                (ngModelChange)="renameSection(section.id, $event)"
              />
              <button
                type="button"
                class="pl-quiet"
                (click)="removeSection(section.id)"
                [disabled]="sections.length <= 1"
              >
                Remove
              </button>
            </header>

            <ul class="pl-list">
              @for (place of section.places; track place.id) {
                <li
                  class="pl-seat"
                  [class.pl-seat--on]="selectedLabel === place.label"
                >
                  <input
                    class="pl-seat__name"
                    [attr.aria-label]="singularNoun + ' name'"
                    [ngModel]="place.label"
                    (focus)="selectPlace(place.label)"
                    (ngModelChange)="renamePlace(section.id, place.id, $event)"
                  />
                  <button
                    type="button"
                    class="pl-quiet pl-quiet--danger"
                    (click)="removePlace(section.id, place.id)"
                    [disabled]="!canRemovePlace(section.id)"
                    [attr.aria-label]="'Remove ' + place.label"
                  >
                    Remove
                  </button>
                </li>
              }
            </ul>

            <div class="pl-room__add">
              <button type="button" class="pl-quiet" (click)="addPlaceToSection(section.id)">
                Add {{ singularNoun.toLowerCase() }}
              </button>
              <span class="pl-room__many">
                <input
                  class="pl-room__count"
                  type="number"
                  min="2"
                  max="20"
                  [(ngModel)]="bulkCount"
                  [attr.aria-label]="'How many ' + placeNounPlural.toLowerCase()"
                />
                <button type="button" class="pl-quiet" (click)="addPlacesToSection(section.id)">
                  Add {{ bulkCount }}
                </button>
              </span>
            </div>
          </section>
        }

        <button type="button" class="pl-quiet pl-quiet--block" (click)="addSection()">
          Add section
        </button>
      </div>

      <leos-confidence-indicator
        confidence
        eyebrow="Guests will join"
        [fact]="placesFact"
        [detail]="selectedLabel ? 'Live shows · ' + selectedLabel : ''"
        [ready]="readyCount > 0"
        okLabel="Looks good"
        waiting="Add at least one place guests can scan"
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
      .pl-edit {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 0.5rem;
      }
      .pl-room {
        padding-bottom: 0.25rem;
        border-bottom: 1px solid var(--studio-line, #eae6e1);
      }
      .pl-room:last-of-type {
        border-bottom: 0;
      }
      .pl-room__head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.35rem;
      }
      .pl-room__name {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        font-family: var(--leos-font-display, Fraunces, serif);
        font-size: 1.25rem;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: var(--studio-ink, #1b2230);
        padding: 0.2rem 0;
      }
      .pl-room__name:focus {
        outline: none;
        box-shadow: inset 0 -1px 0 var(--leos-gold-focus, #c48f38);
      }
      .pl-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .pl-seat {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.75rem;
        min-height: 2.75rem;
        padding: 0.15rem 0 0.15rem 0.65rem;
        border-left: 2px solid transparent;
      }
      .pl-seat--on {
        border-left-color: var(--studio-ink, #1b2230);
      }
      .pl-seat__name {
        width: 100%;
        border: none;
        background: transparent;
        font: inherit;
        font-size: 0.9375rem;
        color: var(--studio-ink, #1b2230);
        padding: 0.45rem 0;
      }
      .pl-seat--on .pl-seat__name {
        font-weight: 650;
      }
      .pl-seat__name:focus {
        outline: none;
      }
      .pl-quiet {
        border: none;
        background: transparent;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-ink-secondary, #6b7280);
        cursor: pointer;
        padding: 0.35rem 0;
        min-height: 2.75rem;
      }
      .pl-quiet:hover {
        color: var(--studio-ink, #1b2230);
      }
      .pl-quiet:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .pl-quiet--block {
        align-self: flex-start;
      }
      .pl-room__add {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem 1.25rem;
        margin: 0.15rem 0 0.85rem;
      }
      .pl-room__many {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .pl-room__count {
        width: 3.25rem;
        min-height: 2.4rem;
        border: 1px solid var(--studio-line, #eae6e1);
        border-radius: 10px;
        background: #fff;
        font: inherit;
        font-size: 0.875rem;
        text-align: center;
        color: var(--studio-ink, #1b2230);
      }
      .pl-room__count:focus {
        outline: none;
        border-color: var(--leos-gold-focus, #c48f38);
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
  sections: PlaceSection[] = [];
  selectedLabel = '';
  savedFlash = false;
  bulkCount = 8;

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
    this.sections = (
      active.placeSections?.length
        ? structuredClone(active.placeSections)
        : defaultPlaceSections(active.typeId)
    ).map((s) => ({
      ...s,
      places: s.places.map((p) => ({ ...p, enabled: true })),
    }));
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

  renameSection(sectionId: string, name: string) {
    this.sections = this.sections.map((s) => (s.id === sectionId ? { ...s, name } : s));
    this.scheduleSave();
  }

  renamePlace(sectionId: string, placeId: string, label: string) {
    let nextLabel = label;
    this.sections = this.sections.map((s) => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        places: s.places.map((p) => {
          if (p.id !== placeId) return p;
          nextLabel = label;
          return { ...p, label };
        }),
      };
    });
    this.selectedLabel = nextLabel;
    this.ctx.setLiveFocusPlace(nextLabel || null);
    this.scheduleSave();
  }

  canRemovePlace(sectionId: string): boolean {
    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) return false;
    if (this.readyCount <= 1) return false;
    if (section.places.length > 1) return true;
    return this.sections.length > 1;
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

  addPlacesToSection(sectionId: string) {
    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const count = Math.min(20, Math.max(2, Number(this.bulkCount) || 2));
    const from = section.places.length + 1;
    const extra = generateNumberedPlaces(this.singularNoun, from, from + count - 1);
    this.sections = this.sections.map((s) =>
      s.id !== sectionId ? s : { ...s, places: [...s.places, ...extra] },
    );
    this.selectedLabel = extra[0]?.label ?? this.selectedLabel;
    this.ctx.setLiveFocusPlace(this.selectedLabel || null);
    this.scheduleSave();
  }

  addSection() {
    const name = `Section ${this.sections.length + 1}`;
    const place = newPlace(`${this.singularNoun} 1`);
    this.sections = [...this.sections, newSection(name, [place])];
    this.selectedLabel = place.label;
    this.ctx.setLiveFocusPlace(place.label);
    this.scheduleSave();
  }

  removePlace(sectionId: string, placeId: string) {
    if (!this.canRemovePlace(sectionId)) return;
    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) return;
    if (section.places.length <= 1) {
      this.removeSection(sectionId);
      return;
    }
    this.sections = this.sections.map((s) =>
      s.id !== sectionId ? s : { ...s, places: s.places.filter((p) => p.id !== placeId) },
    );
    this.reselectIfMissing();
    this.scheduleSave();
  }

  removeSection(sectionId: string) {
    if (this.sections.length <= 1) return;
    this.sections = this.sections.filter((s) => s.id !== sectionId);
    this.reselectIfMissing();
    this.scheduleSave();
  }

  looksGood() {
    this.persist(true);
    void this.router.navigate(['/studio/setup/payments']);
  }

  private reselectIfMissing() {
    const enabled = enabledPlaces(this.sections);
    if (!enabled.some((p) => p.label === this.selectedLabel)) {
      this.selectedLabel = enabled[0]?.label ?? '';
    }
    this.ctx.setLiveFocusPlace(this.selectedLabel || null);
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
