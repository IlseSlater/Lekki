import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { safeBrandImageUrl } from '../leos/catalogue-parity';
import { SETUP_STEPS, experienceLabel, getExperience } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';
import { LeosApiService } from '../services/leos-api.service';
import {
  TW_FAMILIES,
  TW_SHADES,
  matchTwColour,
  twFamily,
  twHex,
  twSwatch500,
  type TwFamilyId,
  type TwShade,
} from '../studio/tailwind-palette';
import { arrivalFromGuestDesign, withArrival } from '../studio/venue-arrival';
import { defaultDesignForType, type GuestExperienceDesign } from '../studio/guest-experience-design';

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
            <span class="leos-field__label">Logos <em class="leos-field__need">optional</em></span>
            <div class="id-logo">
              @if (logoSrc) {
                <img class="id-logo__preview" [src]="logoSrc" alt="" width="56" height="56" />
              } @else {
                <span class="id-logo__placeholder" aria-hidden="true">{{ initial }}</span>
              }
              @for (mark of extraMarks; track mark) {
                <img class="id-logo__preview" [src]="mark" alt="" width="56" height="56" />
              }
              <div class="id-logo__actions">
                <label class="id-logo__pick">
                  <input type="file" accept="image/*" (change)="onLogoPick($event)" />
                  {{ logoUrl ? 'Change logo' : 'Add logo' }}
                </label>
                @if (logoUrl && extraMarks.length < 3) {
                  <label class="id-logo__pick">
                    <input type="file" accept="image/*" (change)="onExtraMarkPick($event)" />
                    Add another
                  </label>
                }
                @if (logoUrl) {
                  <button type="button" class="id-logo__clear" (click)="clearLogo()">Remove</button>
                }
                @if (extraMarks.length) {
                  <button type="button" class="id-logo__clear" (click)="clearLastMark()">
                    Remove extra
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="leos-field">
          <span class="leos-field__label">Words on the phone <em class="leos-field__need">optional</em></span>
          <input
            class="leos-field__input"
            name="headline"
            [(ngModel)]="headline"
            (ngModelChange)="scheduleSave()"
            [placeholder]="displayName"
            maxlength="80"
          />
          <input
            class="leos-field__input"
            name="welcomeLine"
            [(ngModel)]="welcomeLine"
            (ngModelChange)="scheduleSave()"
            placeholder="A line guests see under the name"
            maxlength="140"
          />
        </div>

        <div class="leos-field">
          <span class="leos-field__label">Colour <em class="leos-field__need">optional</em></span>
          <div class="id-families" role="listbox" [attr.aria-label]="'Background colour'">
            @for (family of families; track family.id) {
              <button
                type="button"
                class="id-swatch"
                role="option"
                [class.id-swatch--on]="colourFamily === family.id"
                [style.background]="swatch500(family.id)"
                [attr.aria-label]="family.label"
                (click)="pickFamily(family.id)"
              ></button>
            }
          </div>
          <div class="id-shades">
            @for (shade of shades; track shade) {
              @if (hexFor(colourFamily, shade); as hex) {
                <button
                  type="button"
                  class="id-swatch id-swatch--sm"
                  [class.id-swatch--on]="brandColour.toLowerCase() === hex.toLowerCase()"
                  [style.background]="hex"
                  [attr.aria-label]="colourFamily + ' ' + shade"
                  (click)="pickHex(hex, 'from')"
                ></button>
              }
            }
          </div>
          <label class="id-blend">
            <input type="checkbox" [(ngModel)]="blend" (ngModelChange)="onBlendToggle()" />
            Blend a second colour
          </label>
          @if (blend) {
            <div class="id-families" role="listbox" aria-label="Second colour">
              @for (family of families; track family.id) {
                <button
                  type="button"
                  class="id-swatch"
                  [class.id-swatch--on]="toFamily === family.id"
                  [style.background]="swatch500(family.id)"
                  [attr.aria-label]="family.label"
                  (click)="pickToFamily(family.id)"
                ></button>
              }
            </div>
            <div class="id-shades">
              @for (shade of shades; track shade) {
                @if (hexFor(toFamily, shade); as hex) {
                  <button
                    type="button"
                    class="id-swatch id-swatch--sm"
                    [class.id-swatch--on]="colourTo.toLowerCase() === hex.toLowerCase()"
                    [style.background]="hex"
                    [attr.aria-label]="toFamily + ' ' + shade"
                    (click)="pickHex(hex, 'to')"
                  ></button>
                }
              }
            </div>
          }
          <p class="id-hint">Guests see this wash after Lekki’s splash — then Get started into the menu. Live Experience updates as you choose.</p>
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
        flex-wrap: wrap;
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
      .id-families,
      .id-shades {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .id-swatch {
        width: 1.65rem;
        height: 1.65rem;
        border-radius: 6px;
        border: 2px solid transparent;
        box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.12);
        cursor: pointer;
        padding: 0;
      }
      .id-swatch--sm {
        width: 1.25rem;
        height: 1.25rem;
      }
      .id-swatch--on {
        border-color: var(--leos-ink, #0f172a);
      }
      .id-blend {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
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
  colourTo = '#312e81';
  blend = false;
  headline = '';
  welcomeLine = '';
  extraMarks: string[] = [];
  colourFamily: TwFamilyId = 'gold';
  toFamily: TwFamilyId = 'indigo';
  readonly families = TW_FAMILIES;
  readonly shades = TW_SHADES;
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
    this.applyArrival(active.guestDesign);
    this.syncPaletteFromHex();
    this.ensureVenueAndHydrate();
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.flashTimer) clearTimeout(this.flashTimer);
  }

  swatch500(id: TwFamilyId) {
    const family = twFamily(id);
    return family ? twSwatch500(family) : '#d7a14a';
  }

  hexFor(id: TwFamilyId, shade: TwShade) {
    return twHex(id, shade);
  }

  pickFamily(id: TwFamilyId) {
    this.colourFamily = id;
    const hex = this.swatch500(id);
    this.pickHex(hex, 'from');
  }

  pickToFamily(id: TwFamilyId) {
    this.toFamily = id;
    const hex = this.swatch500(id);
    this.pickHex(hex, 'to');
  }

  pickHex(hex: string, which: 'from' | 'to') {
    if (which === 'to') {
      this.colourTo = hex;
      this.toFamily = matchTwColour(hex).family;
    } else {
      this.brandColour = hex;
      this.colourFamily = matchTwColour(hex).family;
    }
    this.scheduleSave();
  }

  onBlendToggle() {
    if (this.blend && !this.colourTo) this.colourTo = '#312e81';
    this.scheduleSave();
  }

  syncPaletteFromHex() {
    const from = matchTwColour(this.brandColour);
    this.colourFamily = from.family;
    const to = matchTwColour(this.colourTo);
    this.toFamily = to.family;
  }

  applyArrival(design: GuestExperienceDesign | undefined) {
    const arrival = arrivalFromGuestDesign(design);
    this.headline = arrival.headline || '';
    this.welcomeLine = arrival.line || '';
    this.blend = arrival.blend === true;
    this.colourTo = arrival.colourTo || this.colourTo;
    this.extraMarks = arrival.marks || [];
  }

  onColour(value: string) {
    const v = (value || '').trim();
    this.brandColour = /^#[0-9A-Fa-f]{6}$/.test(v) ? v : this.brandColour;
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      this.syncPaletteFromHex();
      this.scheduleSave();
    }
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

  onExtraMarkPick(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 2_000_000) return;
    this.uploadAsset('logo', file, (url) => {
      this.extraMarks = [...this.extraMarks, url].slice(0, 3);
      this.scheduleSave();
    });
  }

  clearLastMark() {
    this.extraMarks = this.extraMarks.slice(0, -1);
    this.scheduleSave();
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
    const active = this.ctx.activeExperience();
    const typeId = active?.typeId || 'restaurant';
    const activeDesign = {
      ...defaultDesignForType(typeId),
      ...(active?.guestDesign || {}),
    } as Record<string, unknown>;
    this.ctx.upsertActive({
      venueName: name || this.venueName,
      logoUrl: this.logoUrl,
      brandColour: this.brandColour || '#d7a14a',
      menuBrandEnabled: false,
      location: this.location.trim(),
      guestDesign: withArrival(activeDesign, {
        headline: this.headline.trim(),
        line: this.welcomeLine.trim(),
        blend: this.blend,
        colourTo: this.colourTo,
        marks: this.extraMarks,
      }) as GuestExperienceDesign,
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
