import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { StudioWorkspaceComponent } from '../leos/studio-workspace.component';
import { StudioContextService } from '../services/studio-context.service';

/**
 * Legacy configure draft — `/studio/configure` redirects to setup/identity.
 * Uses unified workspace so layout matches Create / Setup Engine.
 */
@Component({
  standalone: true,
  imports: [
    FormsModule,
    ExperienceScreenComponent,
    RouterLink,
    ConfidenceIndicatorComponent,
    StudioWorkspaceComponent,
  ],
  template: `
    <leos-studio-workspace>
      <leos-experience-screen
        purpose="Configure your venue"
        lead="Name the place once — guests will see it on their phones instantly."
        help=""
        [showFooter]="true"
      >
        <div config class="studio-form-stack">
          <div class="leos-field">
            <span class="leos-field__label">Venue Name</span>
            <input
              class="leos-field__input"
              [(ngModel)]="venueName"
              (ngModelChange)="updatePreview()"
              name="venue"
              placeholder="e.g., The Blue Door"
            />
          </div>

          <div class="leos-field">
            <span class="leos-field__label">First Place / Table Code</span>
            <input
              class="leos-field__input"
              [(ngModel)]="placeCode"
              (ngModelChange)="updatePreview()"
              name="place"
              placeholder="e.g., Table 12"
            />
          </div>
        </div>

        <leos-confidence-indicator
          confidence
          eyebrow="Guests will join"
          [fact]="previewFact"
          [ready]="!!venueName.trim() && !!placeCode.trim()"
          okLabel="Identity set"
          waiting="Enter your venue name and first place to continue"
        />

        <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/create">Back</a>
        <button
          primary
          type="button"
          class="leos-btn leos-btn--primary"
          [disabled]="!venueName.trim() || !placeCode.trim()"
          (click)="continue()"
        >
          Continue
        </button>
      </leos-experience-screen>
    </leos-studio-workspace>
  `,
  styles: [
    `
      .studio-form-stack {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        margin-bottom: 1.5rem;
      }
      .studio-form-stack .leos-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0;
      }
      .studio-form-stack .leos-field__label {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--leos-ink-tertiary, #94a3b8);
      }
      .studio-form-stack .leos-field__input {
        width: 100%;
        min-height: 3.25rem;
        padding: 0.85rem 1rem;
        border-radius: 12px;
        border: 1px solid var(--leos-border, #eae6e1);
        background: var(--leos-surface, #ffffff);
        color: var(--leos-ink, #0f172a);
        font-size: 1rem;
        font-family: inherit;
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
        transition:
          border-color var(--leos-duration-fast, 160ms) var(--leos-ease, cubic-bezier(0.22, 1, 0.36, 1)),
          box-shadow var(--leos-duration-fast, 160ms) var(--leos-ease, cubic-bezier(0.22, 1, 0.36, 1)),
          background var(--leos-duration-fast, 160ms) var(--leos-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .studio-form-stack .leos-field__input:focus {
        outline: none;
        background: #ffffff;
        border-color: var(--leos-gold-focus, #c48f38);
        box-shadow: var(--leos-shadow-focus);
      }
    `,
  ],
})
export class StudioConfigurePageComponent {
  private readonly router = inject(Router);
  private readonly ctx = inject(StudioContextService);

  venueName = this.ctx.activeExperience()?.venueName || 'The Blue Door';
  placeCode = this.ctx.activeExperience()?.placeCode || 'Table 12';

  get previewFact() {
    const v = this.venueName.trim() || 'Your venue';
    const p = this.placeCode.trim();
    return p ? `${v} · ${p}` : v;
  }

  updatePreview() {
    if (!this.venueName.trim()) return;
    this.ctx.upsertActive({
      venueName: this.venueName.trim(),
      placeCode: this.placeCode.trim(),
    });
  }

  continue() {
    if (!this.venueName.trim() || !this.placeCode.trim()) return;
    this.ctx.upsertActive({
      venueName: this.venueName.trim(),
      placeCode: this.placeCode.trim(),
    });
    this.ctx.markStep('identity');
    void this.router.navigate(['/studio/setup/identity']);
  }
}
