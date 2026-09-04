import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { StudioWorkspaceComponent } from '../leos/studio-workspace.component';
import {
  EXPERIENCE_REGISTRY,
  type ExperienceTypeId,
} from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';

/** Studio S1 — Choose Experience (Surgical White & Rose-Gold Dual-Pane) */
@Component({
  standalone: true,
  imports: [
    ExperienceScreenComponent,
    RouterLink,
    ConfidenceIndicatorComponent,
    StudioWorkspaceComponent,
  ],
  template: `
    <leos-studio-workspace>
      <leos-experience-screen
        [purpose]="purpose"
        [lead]="lead"
        help=""
        [showFooter]="true"
      >
        <div
          config
          class="studio-create-list"
          role="listbox"
          [attr.aria-activedescendant]="selected || null"
        >
          @for (e of experiences; track e.id) {
            <button
              type="button"
              role="option"
              class="studio-create-row"
              [id]="e.id"
              [class.studio-create-row--selected]="selected === e.id"
              [attr.aria-selected]="selected === e.id"
              (click)="select(e.id)"
            >
              <span class="studio-create-row__mark" aria-hidden="true">
                {{ e.label.charAt(0) }}
              </span>
              <span class="studio-create-row__text">
                <span class="studio-create-row__label">{{ e.label }}</span>
                <span class="studio-create-row__blurb">{{ e.blurb }}</span>
              </span>
            </button>
          }
        </div>

        <leos-confidence-indicator
          confidence
          eyebrow="You’ll create"
          [fact]="selectedLabel"
          [ready]="!!selected"
          okLabel="Looks good"
          waiting="Choose an experience type to continue"
        />

        <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/welcome">Back</a>
        <button
          primary
          type="button"
          class="leos-btn leos-btn--primary"
          [disabled]="!selected"
          (click)="continue()"
        >
          Continue
        </button>
      </leos-experience-screen>
    </leos-studio-workspace>
  `,
  styles: [
    `
      .studio-create-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 0 0 1.5rem;
      }
      .studio-create-row {
        display: grid;
        grid-template-columns: 2.75rem 1fr;
        align-items: center;
        column-gap: 1rem;
        width: 100%;
        min-height: 3.5rem;
        padding: 1rem 1.25rem;
        border: 1px solid var(--leos-border, #eae6e1);
        border-radius: 16px;
        background: var(--leos-surface, #ffffff);
        text-align: left;
        cursor: pointer;
        box-shadow: var(--leos-shadow-card, 0 1px 3px rgba(15, 23, 42, 0.04));
        color: inherit;
        transition:
          border-color var(--leos-duration-fast, 160ms) var(--leos-ease, cubic-bezier(0.22, 1, 0.36, 1)),
          box-shadow var(--leos-duration-fast, 160ms) var(--leos-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .studio-create-row:hover {
        border-color: var(--leos-warm-sand-focus, #d8d2c9);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      }
      .studio-create-row.studio-create-row--selected {
        border-color: var(--leos-gold, #d7a14a);
        box-shadow: 0 0 0 3px var(--leos-gold-soft, rgba(215, 161, 74, 0.12));
      }
      .studio-create-row__mark {
        display: grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 12px;
        background: var(--leos-gold-soft, rgba(215, 161, 74, 0.12));
        color: var(--leos-gold-dark, #a96f20);
        font-weight: 700;
        font-size: 1rem;
      }
      .studio-create-row--selected .studio-create-row__mark {
        background: var(--leos-gold, #d7a14a);
        color: var(--leos-on-brand-inverse, #ffffff);
      }
      .studio-create-row__text {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }
      .studio-create-row__label {
        font-size: 1rem;
        font-weight: 600;
        color: var(--leos-ink, #0f172a);
      }
      .studio-create-row__blurb {
        font-size: 0.8125rem;
        color: var(--leos-ink-secondary, #64748b);
      }
    `,
  ],
})
export class StudioCreatePageComponent {
  private readonly router = inject(Router);
  private readonly ctx = inject(StudioContextService);

  readonly experiences = EXPERIENCE_REGISTRY;
  selected: ExperienceTypeId | '' =
    (this.ctx.activeExperience()?.typeId as ExperienceTypeId | undefined) ?? '';

  inheriting = this.ctx.hasExperiences() && !!this.ctx.displayVenue()?.trim();
  purpose = this.inheriting
    ? 'What else are you creating?'
    : 'What experience are you creating?';
  lead = this.inheriting
    ? `We’ll keep ${this.ctx.displayVenue()} — just choose the experience.`
    : 'Pick the one that matches how guests will join.';

  get selectedLabel() {
    if (!this.selected) return 'An experience';
    return EXPERIENCE_REGISTRY.find((e) => e.id === this.selected)?.label ?? 'Experience';
  }

  select(id: ExperienceTypeId) {
    this.selected = id;
    this.ctx.startExperience(id);
  }

  continue() {
    if (!this.selected) return;
    const active = this.ctx.activeExperience();
    if (!active || active.typeId !== this.selected) {
      this.ctx.startExperience(this.selected);
    }
    void this.router.navigate([this.ctx.nextIncompleteSetupPath()]);
  }
}
