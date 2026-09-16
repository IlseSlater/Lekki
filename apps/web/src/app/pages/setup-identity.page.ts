import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { safeBrandImageUrl } from '../leos/catalogue-parity';
import { SETUP_STEPS, experienceLabel, getExperience } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';
import { LeosApiService } from '../services/leos-api.service';

/** Setup — Who you are. Name · Location · Logo · Colour (conversation). */
@Component({
  standalone: true,
  imports: [FormsModule, ExperienceScreenComponent, RouterLink, ConfidenceIndicatorComponent],
  template: `
    <leos-experience-screen [purpose]="purpose" [lead]="lead" help="" [showFooter]="true">
      <div config class="id-config">
        <div class="leos-field">
          <span class="leos-field__label">{{ nameLabel }} <em class="leos-field__need">required</em></span>
          <input
            class="leos-field__input"
            name="venue"
            [(ngModel)]="venueName"
            (ngModelChange)="scheduleSave()"
            autocomplete="organization"
          />
        </div>

        <div class="leos-field">
          <span class="leos-field__label">Location <em class="leos-field__need">optional</em></span>
          <input
            class="leos-field__input"
            name="location"
            [(ngModel)]="location"
            (ngModelChange)="scheduleSave()"
            autocomplete="address-level2"
            placeholder="City or suburb guests recognise"
          />
        </div>

        <div class="id-marks">
          <div class="leos-field">
            <span class="leos-field__label">Logo <em class="leos-field__need">optional</em></span>
            <div class="id-logo">
              @if (logoSrc) {
                <img class="id-logo__preview" [src]="logoSrc" alt="" width="56" height="56" />
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
            <span class="leos-field__label">Colour <em class="leos-field__need">optional</em></span>
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
            <p class="id-hint">Used on the guest phone and pay screens.</p>
          </div>
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
        gap: 1.25rem;
        margin-bottom: 1.5rem;
      }
      .id-config .leos-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0;
      }
      .id-marks {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(12rem, 1fr);
        gap: 1.25rem 1.5rem;
        align-items: start;
      }
      .id-marks .leos-field + .leos-field {
        margin-top: 0;
      }
      .id-config .leos-field__label {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--leos-ink-tertiary, #94a3b8);
      }
      .id-config .leos-field__input {
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
      .id-config .leos-field__input:focus {
        outline: none;
        background: #ffffff;
        border-color: var(--leos-gold-focus, #c48f38);
        box-shadow: var(--leos-shadow-focus);
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
        border: 1px solid var(--leos-border, #eae6e1);
      }
      .id-logo__placeholder {
        display: grid;
        place-items: center;
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 12px;
        background: var(--leos-gold-soft, rgba(215, 161, 74, 0.12));
        color: var(--leos-gold-dark, #a96f20);
        font-weight: 700;
        font-size: 1.25rem;
        border: 1px solid var(--leos-border, #eae6e1);
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
        color: var(--leos-ink, #0f172a);
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
        color: var(--leos-ink-secondary, #64748b);
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
        border: 1px solid var(--leos-border, #eae6e1);
        border-radius: 10px;
        background: transparent;
        cursor: pointer;
      }
      .id-colour__hex {
        max-width: 8rem;
        font-family: ui-monospace, monospace;
      }
      .id-hint {
        margin: 0.15rem 0 0;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--leos-ink-secondary, #64748b);
        line-height: 1.35;
      }
    `,
  ],
})
export class SetupIdentityPageComponent implements OnInit, OnDestroy {
  private readonly ctx = inject(StudioContextService);
  private readonly api = inject(LeosApiService);
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

  get logoSrc() {
    return safeBrandImageUrl(this.logoUrl);
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
    this.ensureVenueAndHydrate();
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
    input.value = '';
    if (!file) return;
    if (file.size > 2_000_000) return;
    this.uploadAsset('logo', file, (url) => {
      this.logoUrl = url;
      this.ctx.upsertActive({ logoUrl: url });
      this.flashSaved();
    });
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

  private ensureVenueAndHydrate(then?: (venueId: string) => void) {
    const active = this.ctx.activeExperience();
    const existing = active?.venueId?.trim();
    if (existing) {
      this.ctx.initWorkspace(existing);
      then?.(existing);
      return;
    }
    this.api.resolveSetupEntryContext(active?.placeCode || undefined).subscribe({
      next: (ctx) => {
        this.ctx.upsertActive(
          { venueId: ctx.venueId, organisationId: ctx.organisationId },
          { syncServer: false },
        );
        this.ctx.initWorkspace(ctx.venueId);
        const hydrated = this.ctx.activeExperience();
        if (hydrated) {
          this.logoUrl = hydrated.logoUrl || this.logoUrl;
          this.brandColour = hydrated.brandColour || this.brandColour;
          this.location = hydrated.location || this.location;
          if (hydrated.venueName) this.venueName = hydrated.venueName;
        }
        then?.(ctx.venueId);
      },
      error: () => {
        this.api.getGrowOverview().subscribe({
          next: (overview) => {
            if (!overview.venueId) return;
            this.ctx.upsertActive({ venueId: overview.venueId }, { syncServer: false });
            this.ctx.initWorkspace(overview.venueId);
            then?.(overview.venueId);
          },
          error: () => undefined,
        });
      },
    });
  }

  private uploadAsset(
    kind: 'logo',
    file: File,
    onOk: (url: string) => void,
  ) {
    this.ensureVenueAndHydrate((venueId) => {
      this.api.uploadVenueAsset(venueId, kind, file).subscribe({
        next: (res) => onOk(res.url),
        error: () => undefined,
      });
    });
  }

  private persist(markDone: boolean) {
    const name =
      this.venueName.trim() || this.ctx.activeExperience()?.venueName?.trim() || '';
    if (!name && !markDone) return;
    this.ctx.upsertActive({
      venueName: name || this.venueName,
      logoUrl: this.logoUrl,
      brandColour: this.brandColour || '#d7a14a',
      menuBrandEnabled: false,
      menuCoverUrl: '',
      location: this.location.trim(),
    });
    if (markDone) this.ctx.markStep('identity');
    this.flashSaved();
  }

  private flashSaved() {
    this.savedFlash = true;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.savedFlash = false;
    }, 1800);
  }
}
