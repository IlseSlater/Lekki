import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { SETUP_STEPS, experienceLabel, getExperience } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';

/** Setup — Who you are. Name · Logo · Colour · Location (conversation). */
@Component({
  standalone: true,
  imports: [FormsModule, ExperienceScreenComponent, RouterLink, ConfidenceIndicatorComponent],
  template: `
    <leos-experience-screen [purpose]="purpose" [lead]="lead" help="" [showFooter]="true">
      <div config class="id-config">
        <div class="leos-field">
          <span class="leos-field__label">{{ nameLabel }}</span>
          <input
            class="leos-field__input"
            name="venue"
            [(ngModel)]="venueName"
            (ngModelChange)="scheduleSave()"
            autocomplete="organization"
          />
        </div>

        <div class="leos-field">
          <span class="leos-field__label">Logo</span>
          <div class="id-logo">
            @if (logoUrl) {
              <img class="id-logo__preview" [src]="logoUrl" alt="" width="56" height="56" />
            } @else {
              <span class="id-logo__placeholder" aria-hidden="true">{{ initial }}</span>
            }
            <div class="id-logo__actions">
              <label class="id-logo__pick">
                <input type="file" accept="image/*" (change)="onLogoPick($event)" />
                {{ logoUrl ? 'Change logo' : 'Add logo' }}
              </label>
              @if (logoUrl) {
                <button type="button" class="id-logo__clear" (click)="clearLogo()">Remove</button>
              }
            </div>
          </div>
        </div>

        <div class="leos-field">
          <span class="leos-field__label">Colour</span>
          <div class="id-colour">
            <input
              class="id-colour__swatch"
              type="color"
              [ngModel]="brandColour"
              (ngModelChange)="onColour($event)"
              [attr.aria-label]="'Brand colour'"
            />
            <input
              class="leos-field__input id-colour__hex"
              name="colour"
              [(ngModel)]="brandColour"
              (ngModelChange)="onColour($event)"
              maxlength="7"
              placeholder="#d7a14a"
            />
          </div>
        </div>

        <div class="leos-field">
          <span class="leos-field__label">Location</span>
          <input
            class="leos-field__input"
            name="location"
            [(ngModel)]="location"
            (ngModelChange)="scheduleSave()"
            autocomplete="address-level2"
            placeholder="City or suburb guests recognise"
          />
        </div>

        @if (savedFlash) {
          <p class="studio-autosave" role="status">Saved automatically</p>
        }
      </div>

      <leos-confidence-indicator
        confidence
        eyebrow="Guests will recognise"
        [fact]="displayName"
        [detail]="locationDetail"
        [ready]="!!venueName.trim()"
        okLabel="Looks good"
        waiting="Add a name guests will recognise"
      />

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/create">Back</a>
      <button
        primary
        type="button"
        class="leos-btn leos-btn--primary"
        [disabled]="!venueName.trim()"
        (click)="continue()"
      >
        Continue
      </button>
    </leos-experience-screen>
  `,
  styles: [
    `
      .id-config {
        display: flex;
        flex-direction: column;
        gap: var(--studio-gap-controls, 20px);
      }
      .id-logo {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .id-logo__preview {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 12px;
        object-fit: cover;
        border: 1px solid var(--studio-line, #e7e2db);
      }
      .id-logo__placeholder {
        display: grid;
        place-items: center;
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 12px;
        background: color-mix(in srgb, var(--id-accent, #d7a14a) 22%, #fff);
        color: var(--studio-ink, #1b2230);
        font-weight: 700;
        font-size: 1.25rem;
        border: 1px solid var(--studio-line, #e7e2db);
      }
      .id-logo__actions {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        align-items: flex-start;
      }
      .id-logo__pick {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--studio-ink, #1b2230);
        cursor: pointer;
        min-height: 2.75rem;
        display: inline-flex;
        align-items: center;
      }
      .id-logo__pick input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        overflow: hidden;
      }
      .id-logo__clear {
        border: none;
        background: transparent;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-ink-secondary, #6b7280);
        cursor: pointer;
        padding: 0;
      }
      .id-colour {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .id-colour__swatch {
        width: 2.75rem;
        height: 2.75rem;
        padding: 0;
        border: 1px solid var(--studio-line, #e7e2db);
        border-radius: 10px;
        background: transparent;
        cursor: pointer;
      }
      .id-colour__hex {
        max-width: 8rem;
        font-family: ui-monospace, monospace;
      }
    `,
  ],
})
export class SetupIdentityPageComponent implements OnInit, OnDestroy {
  private readonly ctx = inject(StudioContextService);
  private readonly router = inject(Router);
  private saveTimer?: ReturnType<typeof setTimeout>;
  private flashTimer?: ReturnType<typeof setTimeout>;

  purpose = SETUP_STEPS[0].title;
  lead = SETUP_STEPS[0].why;
  nameLabel = 'Name';
  venueName = '';
  logoUrl = '';
  brandColour = '#d7a14a';
  location = '';
  typeLabel = 'Restaurant';
  savedFlash = false;

  get displayName() {
    return this.venueName.trim() || 'Your place';
  }

  get initial() {
    return (this.venueName.trim() || 'L').charAt(0).toUpperCase();
  }

  get locationDetail() {
    const bits = [this.typeLabel, this.location.trim()].filter(Boolean);
    return bits.join(' · ');
  }

  ngOnInit() {
    const active = this.ctx.activeExperience();
    if (!active) {
      void this.router.navigate(['/studio/create']);
      return;
    }
    const def = getExperience(active.typeId);
    this.nameLabel = def ? `${def.label} name` : 'Name';
    this.typeLabel = experienceLabel(active.typeId);
    this.venueName = active.venueName || def?.defaults.venueName || '';
    this.logoUrl = active.logoUrl || '';
    this.brandColour = active.brandColour || '#d7a14a';
    this.location = active.location || '';
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.flashTimer) clearTimeout(this.flashTimer);
  }

  onColour(value: string) {
    const v = (value || '').trim();
    this.brandColour = /^#[0-9A-Fa-f]{6}$/.test(v) ? v : this.brandColour;
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) this.scheduleSave();
  }

  onLogoPick(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 1_200_000) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.logoUrl = String(reader.result || '');
      this.scheduleSave();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  clearLogo() {
    this.logoUrl = '';
    this.scheduleSave();
  }

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persist(false), 220);
  }

  continue() {
    if (!this.venueName.trim()) return;
    this.persist(true);
    void this.router.navigate(['/studio/setup/experience']);
  }

  private persist(markDone: boolean) {
    const name = this.venueName.trim();
    if (!name && !markDone) return;
    this.ctx.upsertActive({
      venueName: name || this.venueName,
      logoUrl: this.logoUrl,
      brandColour: this.brandColour || '#d7a14a',
      location: this.location.trim(),
    });
    if (markDone) this.ctx.markStep('identity');
    this.savedFlash = true;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.savedFlash = false;
    }, 1800);
  }
}
