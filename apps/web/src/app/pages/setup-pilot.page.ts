import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { LeosApiService } from '../services/leos-api.service';
import { StudioContextService } from '../services/studio-context.service';

type PilotTab = 'config' | 'places' | 'skus';

type PlaceRow = {
  physicalContextId: string;
  label: string;
  type: string;
  mappingId: string | null;
  externalPlaceId: string;
  draft: string;
  saving: boolean;
  error: string;
};

type SkuRow = {
  catalogueItemId: string;
  label: string;
  category: string;
  unitPrice: number;
  mappingId: string | null;
  externalSkuId: string;
  draft: string;
  saving: boolean;
  error: string;
};

/**
 * Connect Pilot POS — stub activate (partner API pending) + place/SKU maps.
 * One primary action on config: Activate & Show Webhook Secret.
 */
@Component({
  standalone: true,
  imports: [
    FormsModule,
    ExperienceScreenComponent,
    RouterLink,
    ConfidenceIndicatorComponent,
  ],
  template: `
    <leos-experience-screen
      purpose="Connect Pilot POS"
      lead="Keep the guest bill in sync with your till."
      [showFooter]="true"
    >
      <div config class="pilot">
        @if (!venueId) {
          <p class="pilot__error" role="alert">
            No venue on this experience — finish Who / Where in Setup first.
          </p>
        } @else {
          @if (active) {
            <div class="pilot__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                class="pilot__tab"
                [class.pilot__tab--on]="tab === 'config'"
                (click)="tab = 'config'"
              >
                Connection
              </button>
              <button
                type="button"
                role="tab"
                class="pilot__tab"
                [class.pilot__tab--on]="tab === 'places'"
                (click)="openPlaces()"
              >
                Places
              </button>
              <button
                type="button"
                role="tab"
                class="pilot__tab"
                [class.pilot__tab--on]="tab === 'skus'"
                (click)="openSkus()"
              >
                SKUs
              </button>
            </div>
          }

          @if (tab === 'config') {
            <label class="pilot__field">
              <span class="pilot__label">POS API key</span>
              <input
                class="leos-field__input"
                type="password"
                autocomplete="new-password"
                [(ngModel)]="apiKey"
                [disabled]="busy"
                [placeholder]="apiKeySet ? 'Leave blank to keep saved key' : ''"
              />
            </label>

            <fieldset class="pilot__field">
              <legend class="pilot__label">Who settles the guest bill?</legend>
              <label class="pilot__radio">
                <input
                  type="radio"
                  name="settlement"
                  value="lekki"
                  [(ngModel)]="settlementOwner"
                  [disabled]="busy"
                />
                Lekki (Pay at table)
              </label>
              <label class="pilot__radio">
                <input
                  type="radio"
                  name="settlement"
                  value="pos"
                  [(ngModel)]="settlementOwner"
                  [disabled]="busy"
                />
                Pilot till
              </label>
            </fieldset>

            @if (error) {
              <p class="pilot__error" role="alert">{{ error }}</p>
            }
            @if (message) {
              <p class="pilot__ok" role="status">{{ message }}</p>
            }

            @if (webhookSecret) {
              <div class="pilot__secret" role="status">
                <p class="pilot__label">Webhook secret — copy now (shown once)</p>
                <code class="pilot__secret-code">{{ webhookSecret }}</code>
                <p class="pilot__hint">
                  Paste into Pilot. Notify path:
                  <code>{{ webhookNotifyPath }}</code>
                </p>
              </div>
            } @else if (webhookSecretSet) {
              <p class="pilot__hint">
                Webhook secret is stored. Re-activate to rotate and reveal a new one.
                Path: <code>{{ webhookNotifyPath }}</code>
              </p>
            }

            <p class="pilot__hint">
              Live Pilot API verification is pending partner access. We save your key
              and issue a webhook secret so mapping can start.
            </p>
          }

          @if (tab === 'places') {
            @if (placesLoading) {
              <p class="pilot__hint">Loading places…</p>
            } @else if (!placeRows.length) {
              <p class="pilot__hint">No places yet — add tables in Floor first.</p>
            } @else {
              <div class="pilot__table" role="table">
                <div class="pilot__thead" role="row">
                  <span role="columnheader">Place</span>
                  <span role="columnheader">Pilot place id</span>
                </div>
                @for (row of placeRows; track row.physicalContextId) {
                  <div class="pilot__row" role="row">
                    <span class="pilot__cell-label" role="cell">{{ row.label }}</span>
                    <label class="pilot__cell-input" role="cell">
                      <input
                        class="leos-field__input"
                        [(ngModel)]="row.draft"
                        [disabled]="row.saving"
                        (ngModelChange)="schedulePlaceSave(row)"
                        placeholder="e.g. TBL-12"
                      />
                      @if (row.error) {
                        <span class="pilot__row-err">{{ row.error }}</span>
                      }
                    </label>
                  </div>
                }
              </div>
            }
          }

          @if (tab === 'skus') {
            @if (skusLoading) {
              <p class="pilot__hint">Loading catalogue…</p>
            } @else if (!skuRows.length) {
              <p class="pilot__hint">No catalogue items — add dishes in Menu first.</p>
            } @else {
              <div class="pilot__table" role="table">
                <div class="pilot__thead" role="row">
                  <span role="columnheader">Item</span>
                  <span role="columnheader">Pilot SKU</span>
                </div>
                @for (row of skuRows; track row.catalogueItemId) {
                  <div class="pilot__row" role="row">
                    <span class="pilot__cell-label" role="cell"
                      >{{ row.label }}
                      <em>{{ row.category }}</em></span
                    >
                    <label class="pilot__cell-input" role="cell">
                      <input
                        class="leos-field__input"
                        [(ngModel)]="row.draft"
                        [disabled]="row.saving"
                        (ngModelChange)="scheduleSkuSave(row)"
                        placeholder="e.g. BEER-01"
                      />
                      @if (row.error) {
                        <span class="pilot__row-err">{{ row.error }}</span>
                      }
                    </label>
                  </div>
                }
              </div>
            }
          }
        }
      </div>

      <leos-confidence-indicator
        confidence
        eyebrow="Guests will feel"
        fact="Orders from the till appear on the phone"
        [detail]="venueName"
        [ready]="active"
        okLabel="Pilot sync is on"
        waiting="Activate to map places and SKUs"
      />

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/integrations">Back</a>
      @if (tab === 'config') {
        <button
          primary
          type="button"
          class="leos-btn leos-btn--primary"
          [disabled]="busy || !canActivate"
          (click)="activate()"
        >
          {{ busy ? 'Saving…' : active ? 'Save & Rotate Secret' : 'Activate Pilot' }}
        </button>
      } @else {
        <a primary class="leos-btn leos-btn--primary" routerLink="/studio/integrations"
          >Done</a
        >
      }
    </leos-experience-screen>
  `,
  styles: [
    `
      .pilot__tabs {
        display: flex;
        gap: 0.35rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .pilot__tab {
        border: 1px solid var(--studio-line, #e7e2db);
        background: #fff;
        border-radius: 999px;
        padding: 0.35rem 0.85rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-ink-secondary, #6b7280);
        cursor: pointer;
      }
      .pilot__tab--on {
        border-color: #d7a14a;
        color: var(--studio-ink, #1b2230);
        background: #fbf6ee;
      }
      .pilot__field {
        display: grid;
        gap: 0.35rem;
        margin-bottom: 0.85rem;
        border: 0;
        padding: 0;
        min-inline-size: 0;
      }
      .pilot__label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-ink, #1b2230);
      }
      .pilot__radio {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: var(--studio-ink, #1b2230);
      }
      .pilot__error {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        color: #b42318;
      }
      .pilot__ok {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #4f8a6b;
      }
      .pilot__hint {
        margin: 0.5rem 0 0;
        font-size: 0.8125rem;
        color: var(--studio-ink-secondary, #6b7280);
        line-height: 1.4;
      }
      .pilot__hint code {
        font-size: 0.75rem;
        word-break: break-all;
      }
      .pilot__secret {
        margin: 0.75rem 0;
        padding: 0.85rem 1rem;
        border-radius: 10px;
        border: 1px solid #d7a14a;
        background: #fbf6ee;
      }
      .pilot__secret-code {
        display: block;
        margin: 0.4rem 0;
        font-size: 0.85rem;
        word-break: break-all;
      }
      .pilot__table {
        display: grid;
        gap: 0.45rem;
      }
      .pilot__thead,
      .pilot__row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
        gap: 0.65rem;
        align-items: start;
      }
      .pilot__thead {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .pilot__cell-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--studio-ink, #1b2230);
        padding-top: 0.55rem;
      }
      .pilot__cell-label em {
        display: block;
        font-style: normal;
        font-weight: 500;
        font-size: 0.75rem;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .pilot__cell-input {
        display: grid;
        gap: 0.2rem;
      }
      .pilot__row-err {
        font-size: 0.75rem;
        color: #b42318;
      }
    `,
  ],
})
export class SetupPilotPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(LeosApiService);
  private readonly ctx = inject(StudioContextService);
  private readonly router = inject(Router);

  venueId = '';
  venueName = '';
  tab: PilotTab = 'config';
  apiKey = '';
  apiKeySet = false;
  webhookSecretSet = false;
  webhookSecret = '';
  webhookNotifyPath = '';
  settlementOwner: 'lekki' | 'pos' = 'lekki';
  active = false;
  busy = false;
  error = '';
  message = '';

  placeRows: PlaceRow[] = [];
  skuRows: SkuRow[] = [];
  placesLoading = false;
  skusLoading = false;
  placesLoaded = false;
  skusLoaded = false;

  private placeTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private skuTimers = new Map<string, ReturnType<typeof setTimeout>>();

  get canActivate() {
    if (!this.venueId) return false;
    if (!this.apiKey.trim() && !this.apiKeySet) return false;
    return true;
  }

  ngOnInit() {
    if (!this.ctx.hasExperiences()) {
      void this.router.navigate(['/studio/create']);
      return;
    }
    const active = this.ctx.activeExperience();
    this.venueId = active?.venueId?.trim() || '';
    this.venueName = active?.venueName || this.ctx.displayVenue() || 'Your place';
    if (!this.venueId) return;
    this.api.getPosInstall(this.venueId).subscribe({
      next: (install) => {
        this.active = install.status === 'active';
        this.apiKeySet = !!install.apiKeySet;
        this.webhookSecretSet = !!install.webhookSecretSet;
        this.webhookNotifyPath = install.webhookNotifyPath || '';
        this.settlementOwner =
          install.settlementOwner === 'pos' ? 'pos' : 'lekki';
      },
      error: () => {
        this.error = 'Could not load Pilot connection status.';
      },
    });
  }

  ngOnDestroy() {
    for (const t of this.placeTimers.values()) clearTimeout(t);
    for (const t of this.skuTimers.values()) clearTimeout(t);
  }

  activate() {
    if (!this.canActivate || this.busy || !this.venueId) return;
    this.busy = true;
    this.error = '';
    this.message = '';
    this.webhookSecret = '';
    const body: {
      apiKey?: string;
      settlementOwner: 'lekki' | 'pos';
    } = { settlementOwner: this.settlementOwner };
    if (this.apiKey.trim()) body.apiKey = this.apiKey.trim();

    this.api.activatePosPilot(this.venueId, body).subscribe({
      next: (res) => {
        this.busy = false;
        this.active = true;
        this.apiKey = '';
        this.apiKeySet = true;
        this.webhookSecretSet = true;
        this.webhookSecret = res.webhookSecret;
        this.webhookNotifyPath = res.webhookNotifyPath;
        this.settlementOwner =
          res.settlementOwner === 'pos' ? 'pos' : 'lekki';
        this.message = res.message || 'Pilot connection saved.';
      },
      error: (err) => {
        this.busy = false;
        this.error =
          err?.error?.message ||
          'Could not activate Pilot. Check the API key and try again.';
      },
    });
  }

  openPlaces() {
    this.tab = 'places';
    if (this.placesLoaded || this.placesLoading || !this.venueId) return;
    this.placesLoading = true;
    this.api.getPosPlaceWorkspace(this.venueId).subscribe({
      next: (res) => {
        this.placesLoading = false;
        this.placesLoaded = true;
        this.placeRows = (res.rows || []).map((r) => ({
          ...r,
          draft: r.externalPlaceId || '',
          saving: false,
          error: '',
        }));
      },
      error: () => {
        this.placesLoading = false;
        this.error = 'Could not load place mappings.';
      },
    });
  }

  openSkus() {
    this.tab = 'skus';
    if (this.skusLoaded || this.skusLoading || !this.venueId) return;
    this.skusLoading = true;
    this.api.getPosSkuWorkspace(this.venueId).subscribe({
      next: (res) => {
        this.skusLoading = false;
        this.skusLoaded = true;
        this.skuRows = (res.rows || []).map((r) => ({
          ...r,
          draft: r.externalSkuId || '',
          saving: false,
          error: '',
        }));
      },
      error: () => {
        this.skusLoading = false;
        this.error = 'Could not load SKU mappings.';
      },
    });
  }

  schedulePlaceSave(row: PlaceRow) {
    const prev = this.placeTimers.get(row.physicalContextId);
    if (prev) clearTimeout(prev);
    this.placeTimers.set(
      row.physicalContextId,
      setTimeout(() => this.savePlace(row), 450),
    );
  }

  scheduleSkuSave(row: SkuRow) {
    const prev = this.skuTimers.get(row.catalogueItemId);
    if (prev) clearTimeout(prev);
    this.skuTimers.set(
      row.catalogueItemId,
      setTimeout(() => this.saveSku(row), 450),
    );
  }

  private savePlace(row: PlaceRow) {
    if (!this.venueId) return;
    const value = row.draft.trim();
    row.saving = true;
    row.error = '';
    if (!value) {
      if (!row.mappingId) {
        row.saving = false;
        return;
      }
      this.api.deletePosPlace(this.venueId, row.mappingId).subscribe({
        next: () => {
          row.mappingId = null;
          row.externalPlaceId = '';
          row.saving = false;
        },
        error: () => {
          row.saving = false;
          row.error = 'Could not clear mapping';
        },
      });
      return;
    }
    this.api
      .upsertPosPlace(this.venueId, {
        physicalContextId: row.physicalContextId,
        externalPlaceId: value,
      })
      .subscribe({
        next: (res) => {
          row.mappingId = res.id;
          row.externalPlaceId = value;
          row.saving = false;
        },
        error: (err) => {
          row.saving = false;
          row.error = err?.error?.message || 'Save failed';
        },
      });
  }

  private saveSku(row: SkuRow) {
    if (!this.venueId) return;
    const value = row.draft.trim();
    row.saving = true;
    row.error = '';
    if (!value) {
      if (!row.mappingId) {
        row.saving = false;
        return;
      }
      this.api.deletePosSku(this.venueId, row.mappingId).subscribe({
        next: () => {
          row.mappingId = null;
          row.externalSkuId = '';
          row.saving = false;
        },
        error: () => {
          row.saving = false;
          row.error = 'Could not clear mapping';
        },
      });
      return;
    }
    this.api
      .upsertPosSku(this.venueId, {
        catalogueItemId: row.catalogueItemId,
        externalSkuId: value,
      })
      .subscribe({
        next: (res) => {
          row.mappingId = res.id;
          row.externalSkuId = value;
          row.saving = false;
        },
        error: (err) => {
          row.saving = false;
          row.error = err?.error?.message || 'Save failed';
        },
      });
  }
}
