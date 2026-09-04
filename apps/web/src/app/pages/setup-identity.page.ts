import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { SETUP_STEPS, experienceLabel, getExperience } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';
import { LeosApiService } from '../services/leos-api.service';

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
          <p class="id-hint">Tints the menu half-moon when you show it.</p>
        </div>

        <div class="leos-field">
          <span class="leos-field__label">Menu brand</span>
          <label class="id-toggle">
            <input
              type="checkbox"
              [(ngModel)]="menuBrandEnabled"
              (ngModelChange)="onMenuBrandToggle()"
            />
            <span>Show half-moon on menu</span>
          </label>
          <p class="id-hint">Sits above filters. Fades as guests scroll into the menu.</p>
          @if (menuBrandEnabled) {
            <div class="id-cover">
              @if (menuCoverUrl) {
                <img class="id-cover__preview" [src]="menuCoverUrl" alt="" />
              } @else {
                <span class="id-cover__placeholder" aria-hidden="true">Cover</span>
              }
              <div class="id-logo__actions">
                <label class="id-logo__pick">
                  <input type="file" accept="image/*" (change)="onCoverPick($event)" />
                  {{ menuCoverUrl ? 'Change cover' : 'Add cover image' }}
                </label>
                @if (menuCoverUrl) {
                  <button type="button" class="id-logo__clear" (click)="clearCover()">Remove</button>
                }
              </div>
            </div>
            <p class="id-hint">Logo (above) centres on the moon. Colour tints the dark overlay.</p>
          }
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
        gap: 1.25rem;
        margin-bottom: 1.5rem;
      }
      .id-config .leos-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0;
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
      .id-toggle {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        min-height: 2.75rem;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--leos-ink, #0f172a);
        cursor: pointer;
      }
      .id-toggle input {
        width: 1.15rem;
        height: 1.15rem;
        accent-color: var(--leos-gold, #d7a14a);
      }
      .id-cover {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.65rem;
      }
      .id-cover__preview {
        width: 5.5rem;
        height: 3.25rem;
        border-radius: 12px 12px 999px 999px;
        object-fit: cover;
        border: 1px solid var(--leos-border, #eae6e1);
      }
      .id-cover__placeholder {
        display: grid;
        place-items: center;
        width: 5.5rem;
        height: 3.25rem;
        border-radius: 12px 12px 999px 999px;
        background: #1b2230;
        color: #94a3b8;
        font-size: 0.75rem;
        font-weight: 650;
        border: 1px solid var(--leos-border, #eae6e1);
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
  menuBrandEnabled = false;
  menuCoverUrl = '';
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
    this.menuBrandEnabled = !!active.menuBrandEnabled;
    this.menuCoverUrl = active.menuCoverUrl || '';
    this.location = active.location || '';
    this.api.getGrowOverview().subscribe({
      next: (overview) => {
        if (overview.venueId) {
          this.ctx.upsertActive({ venueId: overview.venueId });
        }
      },
      error: () => undefined,
    });
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

  onCoverPick(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 1_800_000) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.menuCoverUrl = String(reader.result || '');
      this.scheduleSave();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  clearCover() {
    this.menuCoverUrl = '';
    this.scheduleSave();
  }

  onMenuBrandToggle() {
    // Save immediately so Live Experience switches to the menu shell with the moon.
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.persist(false);
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
    const name =
      this.venueName.trim() || this.ctx.activeExperience()?.venueName?.trim() || '';
    if (!name && !markDone) return;
    this.ctx.upsertActive({
      venueName: name || this.venueName,
      logoUrl: this.logoUrl,
      brandColour: this.brandColour || '#d7a14a',
      menuBrandEnabled: this.menuBrandEnabled,
      menuCoverUrl: this.menuCoverUrl,
      location: this.location.trim(),
    });
    this.publishBrandToRuntime(name || this.venueName);
    if (markDone) this.ctx.markStep('identity');
    this.savedFlash = true;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.savedFlash = false;
    }, 1800);
  }

  /** Publish brand + guestDesign to runtime for guest entry resolve. */
  private publishBrandToRuntime(venueName: string) {
    const active = this.ctx.activeExperience();
    const send = (venueId: string) => {
      this.api
        .saveVenueBrand({
          venueId,
          menuBrandEnabled: this.menuBrandEnabled,
          brandColour: this.brandColour || '#d7a14a',
          venueName: venueName.trim() || undefined,
          guestDesignJson: active?.guestDesign as Record<string, unknown> | undefined,
        })
        .subscribe({ error: () => undefined });
    };
    const venueId = active?.venueId?.trim();
    if (venueId) {
      send(venueId);
      return;
    }
    this.api.resolveSetupEntryContext(active?.placeCode || undefined).subscribe({
      next: (ctx) => {
        this.ctx.upsertActive({ venueId: ctx.venueId, organisationId: ctx.organisationId });
        send(ctx.venueId);
      },
      error: () => undefined,
    });
  }
}
