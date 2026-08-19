import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { SETUP_STEPS, experienceLabel, getExperience } from '../studio/experience-registry';
import {
  DESIGN_GROUPS,
  categoriesFromDesign,
  countEnabled,
  defaultDesignForType,
  guestCanSummary,
  type GuestDesignKey,
  type GuestExperienceDesign,
} from '../studio/guest-experience-design';
import { StudioContextService } from '../services/studio-context.service';

/** Setup — What guests experience. Signature: menu comes alive in the phone. */
@Component({
  standalone: true,
  imports: [FormsModule, ExperienceScreenComponent, ConfidenceIndicatorComponent],
  template: `
    <leos-experience-screen [purpose]="purpose" [lead]="lead" help="" [showFooter]="true">
      <div config class="xp-body">
        @if (mode === 'summary') {
          <div class="xp-summary">
            <p class="xp-summary__eyebrow">{{ typeLabel }}</p>
            <h2 class="xp-summary__title">{{ venueName }}</h2>
          </div>
        } @else {
          @if (savedFlash) {
            <p class="studio-autosave" role="status">Saved automatically</p>
          }
          @for (group of groups; track group.id) {
            <section class="xp-group">
              <h3 class="xp-group__title">{{ group.title }}</h3>
              <ul class="xp-group__list">
                @for (item of group.items; track item.key) {
                  <li>
                    <label class="xp-toggle">
                      <input
                        type="checkbox"
                        [checked]="design[item.key]"
                        (change)="toggle(item.key, $event)"
                      />
                      <span>{{ item.label }}</span>
                    </label>
                  </li>
                }
              </ul>
            </section>
          }
        }
      </div>

      <leos-confidence-indicator
        confidence
        eyebrow="Guests can"
        [fact]="confidenceFact"
        [detail]="mode === 'summary' ? lastUpdatedLabel + ' · last updated' : ''"
        [ready]="canContinue"
        okLabel="Looks good"
        [waiting]="mode === 'edit' ? 'Turn on something guests can browse or request' : ''"
      />

      <button escape type="button" class="leos-btn leos-btn--secondary" (click)="onEscape()">
        Back
      </button>
      <button
        primary
        type="button"
        class="leos-btn leos-btn--primary"
        [disabled]="mode === 'edit' && !canContinue"
        (click)="onContinue()"
      >
        Continue
      </button>
    </leos-experience-screen>
  `,
  styles: [
    `
      .xp-group {
        margin-bottom: var(--studio-gap-controls, 20px);
      }
      .xp-group:last-child {
        margin-bottom: 0;
      }
      .xp-group__title {
        margin: 0 0 var(--studio-gap-labels, 8px);
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .xp-group__list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .xp-toggle {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 0;
        font-weight: 500;
        font-size: 0.9375rem;
        cursor: pointer;
        border-bottom: 1px solid var(--studio-line, #e7e2db);
      }
      .xp-toggle:last-child {
        border-bottom: none;
      }
      .xp-toggle input {
        width: 1.05rem;
        height: 1.05rem;
        accent-color: #d7a14a;
        transition: transform var(--studio-duration-fast, 160ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .xp-toggle input:checked {
        transform: scale(1.05);
      }
      .xp-summary__eyebrow {
        margin: 0;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--leos-gold-dark, #a96f20);
      }
      .xp-summary__title {
        margin: 0.35rem 0 0;
        font-size: 1.25rem;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: var(--studio-ink, #1b2230);
      }
    `,
  ],
})
export class SetupExperienceStepPageComponent implements OnInit, OnDestroy {
  private readonly ctx = inject(StudioContextService);
  private readonly router = inject(Router);
  private saveTimer?: ReturnType<typeof setTimeout>;
  private flashTimer?: ReturnType<typeof setTimeout>;

  purpose = SETUP_STEPS[1].title;
  lead = SETUP_STEPS[1].why;
  mode: 'summary' | 'edit' = 'edit';
  design: GuestExperienceDesign = defaultDesignForType('restaurant');
  venueName = '';
  typeLabel = 'Restaurant';
  typeId = 'restaurant';
  savedFlash = false;
  readonly groups = DESIGN_GROUPS;

  get enabledCount() {
    return countEnabled(this.design);
  }

  get categoryCount() {
    return categoriesFromDesign(this.design, this.typeId).length;
  }

  get canContinue() {
    return (
      this.categoryCount > 0 ||
      this.design.callStaff ||
      this.design.browseMenu ||
      this.design.orderFood ||
      this.design.payAtTable ||
      this.design.book ||
      this.design.specialRequests
    );
  }

  get confidenceFact() {
    return guestCanSummary(this.design);
  }

  get lastUpdatedLabel() {
    const active = this.ctx.activeExperience();
    if (!active?.experienceUpdatedAt) return 'Just now';
    const d = new Date(active.experienceUpdatedAt);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  ngOnInit() {
    const active = this.ctx.activeExperience();
    if (!active) {
      void this.router.navigate(['/studio/create']);
      return;
    }
    this.typeLabel = experienceLabel(active.typeId);
    this.typeId = active.typeId;
    this.venueName = active.venueName || getExperience(active.typeId)?.defaults.venueName || 'Your place';
    this.design = active.guestDesign
      ? { ...defaultDesignForType(active.typeId), ...active.guestDesign }
      : defaultDesignForType(active.typeId);
    if (active.steps?.experience && active.experienceUpdatedAt) {
      this.mode = 'summary';
    }
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.flashTimer) clearTimeout(this.flashTimer);
  }

  toggle(key: GuestDesignKey, ev: Event) {
    const on = (ev.target as HTMLInputElement).checked;
    this.design = { ...this.design, [key]: on };
    this.scheduleSave();
  }

  enterEdit() {
    this.mode = 'edit';
  }

  onEscape() {
    if (this.mode === 'summary') {
      this.enterEdit();
      return;
    }
    void this.router.navigate(['/studio/setup/identity']);
  }

  onContinue() {
    if (this.mode === 'summary') {
      this.goPlaces();
      return;
    }
    this.looksGood();
  }

  goPlaces() {
    this.persist(true);
    void this.router.navigate(['/studio/setup/places']);
  }

  looksGood() {
    this.persist(true);
    void this.router.navigate(['/studio/setup/places']);
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persist(false), 280);
  }

  private persist(markDone: boolean) {
    const categories = categoriesFromDesign(this.design, this.typeId);
    this.ctx.upsertActive({
      guestDesign: { ...this.design },
      categories,
      experienceNotes: categories.join(', ') || 'Guest experience',
      experienceUpdatedAt: new Date().toISOString(),
    });
    if (markDone) this.ctx.markStep('experience');
    this.savedFlash = true;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.savedFlash = false;
    }, 1800);
  }
}
