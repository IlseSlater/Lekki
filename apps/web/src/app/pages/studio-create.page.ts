import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { LiveExperiencePanelComponent } from '../leos/live-experience-panel.component';
import {
  EXPERIENCE_REGISTRY,
  type ExperienceTypeId,
} from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';

/** Choose Experience — typography-led; Live Experience beside; never say Pack. */
@Component({
  standalone: true,
  imports: [
    ExperienceScreenComponent,
    RouterLink,
    ConfidenceIndicatorComponent,
    LiveExperiencePanelComponent,
  ],
  template: `
    <div class="create-engine">
      <div class="create-engine__body">
        <div class="create-engine__studio studio-motion-appear">
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
                  <span class="studio-create-row__mark" aria-hidden="true">{{ e.label.charAt(0) }}</span>
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
        </div>
        <div class="create-engine__live studio-motion-appear-delay">
          <leos-live-experience-panel />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .create-engine {
        width: 100%;
        max-width: calc(var(--studio-studio-width, 640px) + var(--studio-live-width, 420px) + 6rem);
        margin: 0 auto;
        padding: var(--studio-pad-outer, 48px) var(--studio-pad-outer, 48px) 3rem;
        box-sizing: border-box;
      }
      .create-engine__body {
        display: grid;
        gap: 3rem;
        align-items: start;
      }
      @media (min-width: 1024px) {
        .create-engine__body {
          grid-template-columns: minmax(0, var(--studio-studio-width, 640px)) var(--studio-live-width, 420px);
          justify-content: space-between;
        }
      }
      .create-engine__studio {
        min-width: 0;
        max-width: var(--studio-studio-width, 640px);
      }
      .create-engine__live {
        min-width: 0;
        display: flex;
        justify-content: center;
        padding-top: 0.5rem;
      }
      @media (max-width: 1023px) {
        .create-engine__live {
          order: -1;
        }
        .create-engine {
          padding: 1.5rem 1.25rem 2.5rem;
        }
      }
      .studio-create-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin: 0;
      }
      .studio-create-row {
        display: grid;
        grid-template-columns: 2.75rem 1fr;
        align-items: center;
        column-gap: 0.85rem;
        width: 100%;
        min-height: 2.75rem;
        padding: 1.1rem 0;
        border: 0;
        border-bottom: 1px solid var(--studio-line, #e7e2db);
        border-radius: 0;
        background: transparent;
        text-align: left;
        cursor: pointer;
        transition: color var(--studio-duration-fast, 160ms) var(--studio-ease);
      }
      .studio-create-row:last-child {
        border-bottom: none;
      }
      .studio-create-row__mark {
        display: grid;
        place-items: center;
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 12px;
        background: color-mix(in srgb, var(--leos-gold, #d7a14a) 18%, #fff);
        color: var(--studio-ink, #1b2230);
        font-weight: 700;
        font-size: 1rem;
      }
      .studio-create-row--selected .studio-create-row__mark {
        background: color-mix(in srgb, var(--leos-gold, #d7a14a) 42%, #fff);
      }
      .studio-create-row__text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
      }
      .studio-create-row--selected .studio-create-row__label {
        color: var(--leos-gold-dark, #a96f20);
      }
      .studio-create-row__label {
        font-size: 1.0625rem;
        font-weight: 600;
        color: var(--studio-ink, #1b2230);
      }
      .studio-create-row__blurb {
        font-size: 0.875rem;
        color: var(--studio-ink-secondary, #6b7280);
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

  /** Second+ experience inherits venue identity — Never Ask a Human to Remember. */
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
