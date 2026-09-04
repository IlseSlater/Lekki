import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { SETUP_STEPS } from '../studio/experience-registry';
import {
  defaultDesignForType,
  type GuestDesignKey,
  type GuestExperienceDesign,
} from '../studio/guest-experience-design';
import { StudioContextService } from '../services/studio-context.service';
import { LeosApiService } from '../services/leos-api.service';

type PayOption = { key: GuestDesignKey | 'card' | 'applePay' | 'googlePay'; label: string };

/**
 * Setup — How guests pay.
 * PayFast credentials + guest payment toggles; Continue only when connector is active.
 */
@Component({
  standalone: true,
  imports: [FormsModule, ExperienceScreenComponent, RouterLink, ConfidenceIndicatorComponent],
  template: `
    <leos-experience-screen [purpose]="purpose" [lead]="lead" help="" [showFooter]="true">
      <div config class="pay-edit">
        @if (savedFlash) {
          <p class="studio-autosave" role="status">Saved automatically</p>
        }

        <section class="pay-section">
          <h3 class="pay-section__title">PayFast</h3>
          <p class="pay-section__hint">
            Your venue receives payments. LEOS takes a subscription fee only.
          </p>
          @if (payfastStatus === 'active') {
            <p class="pay-section__status pay-section__status--ok" role="status">
              PayFast is live{{ payfastMerchantId ? ' · ' + payfastMerchantId : '' }}
            </p>
          } @else if (payfastStatus === 'verified') {
            <p class="pay-section__status" role="status">Credentials verified — activate to go live</p>
          }

          <label class="pay-field">
            <span class="pay-field__label">Environment</span>
            <select class="leos-field__input" [(ngModel)]="payfastEnvironment" [disabled]="payfastBusy">
              <option value="sandbox">Sandbox (test)</option>
              <option value="production">Production</option>
            </select>
          </label>
          <label class="pay-field">
            <span class="pay-field__label">Merchant ID</span>
            <input
              class="leos-field__input"
              autocomplete="off"
              [(ngModel)]="merchantId"
              [disabled]="payfastBusy"
            />
          </label>
          <label class="pay-field">
            <span class="pay-field__label">Merchant key</span>
            <input
              class="leos-field__input"
              type="password"
              autocomplete="new-password"
              [(ngModel)]="merchantKey"
              [disabled]="payfastBusy"
              [placeholder]="passphraseSet ? 'Leave blank to keep saved key' : ''"
            />
          </label>
          <label class="pay-field">
            <span class="pay-field__label">Passphrase</span>
            <input
              class="leos-field__input"
              type="password"
              autocomplete="new-password"
              [(ngModel)]="passphrase"
              [disabled]="payfastBusy"
              [placeholder]="passphraseSet ? 'Leave blank to keep saved passphrase' : 'Required for ITN verification'"
            />
          </label>

          @if (payfastError) {
            <p class="pay-section__error" role="alert">{{ payfastError }}</p>
          }
          @if (payfastMessage) {
            <p class="pay-section__status pay-section__status--ok" role="status">{{ payfastMessage }}</p>
          }

          <div class="pay-section__actions">
            <button
              type="button"
              class="leos-btn leos-btn--secondary"
              [disabled]="payfastBusy || !canTestPayfast"
              (click)="testPayfast()"
            >
              {{ payfastBusy ? 'Testing…' : 'Test connection' }}
            </button>
            <button
              type="button"
              class="leos-btn leos-btn--primary"
              [disabled]="payfastBusy || payfastStatus !== 'verified'"
              (click)="activatePayfast()"
            >
              Activate PayFast
            </button>
          </div>
        </section>

        <section class="pay-section">
          <h3 class="pay-section__title">Guest checkout</h3>
          <ul class="pay-list">
            @for (opt of options; track opt.key) {
              <li>
                <label class="pay-toggle">
                  <input
                    type="checkbox"
                    [checked]="isOn(opt.key)"
                    (change)="toggle(opt.key, $event)"
                  />
                  <span>{{ opt.label }}</span>
                </label>
              </li>
            }
          </ul>
        </section>
      </div>

      <leos-confidence-indicator
        confidence
        eyebrow="Guests will pay"
        [fact]="confidenceFact"
        [detail]="venueName"
        [ready]="canContinue"
        okLabel="Looks good"
        waiting="Connect and activate PayFast, then turn on at least one checkout method"
      />

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/setup/places">Back</a>
      <button
        primary
        type="button"
        class="leos-btn leos-btn--primary"
        [disabled]="!canContinue"
        (click)="continue()"
      >
        Continue
      </button>
    </leos-experience-screen>
  `,
  styles: [
    `
      .pay-section {
        margin-bottom: 1.5rem;
      }
      .pay-section:last-child {
        margin-bottom: 0;
      }
      .pay-section__title {
        margin: 0 0 0.35rem;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .pay-section__hint {
        margin: 0 0 0.85rem;
        font-size: 0.875rem;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .pay-section__status {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .pay-section__status--ok {
        color: #4f8a6b;
      }
      .pay-section__error {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        color: #b42318;
      }
      .pay-section__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }
      .pay-field {
        display: grid;
        gap: 0.35rem;
        margin-bottom: 0.65rem;
      }
      .pay-field__label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-ink, #1b2230);
      }
      .pay-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .pay-toggle {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-height: 2.75rem;
        padding: 0.85rem 0;
        font-weight: 500;
        font-size: 0.9375rem;
        cursor: pointer;
        border-bottom: 1px solid var(--studio-line, #e7e2db);
      }
      .pay-toggle:last-child {
        border-bottom: none;
      }
      .pay-toggle input {
        width: 1.05rem;
        height: 1.05rem;
        accent-color: #d7a14a;
      }
    `,
  ],
})
export class SetupPaymentsPageComponent implements OnInit, OnDestroy {
  private readonly ctx = inject(StudioContextService);
  private readonly api = inject(LeosApiService);
  private readonly router = inject(Router);
  private saveTimer?: ReturnType<typeof setTimeout>;
  private flashTimer?: ReturnType<typeof setTimeout>;

  purpose = SETUP_STEPS[3].title;
  lead = SETUP_STEPS[3].why;
  venueName = '';
  design: GuestExperienceDesign = defaultDesignForType('restaurant');
  card = true;
  applePay = true;
  googlePay = true;
  savedFlash = false;

  merchantId = '';
  merchantKey = '';
  passphrase = '';
  payfastEnvironment: 'sandbox' | 'production' = 'sandbox';
  payfastStatus: 'none' | 'verified' | 'active' = 'none';
  payfastMerchantId = '';
  passphraseSet = false;
  payfastBusy = false;
  payfastError = '';
  payfastMessage = '';

  readonly options: PayOption[] = [
    { key: 'card', label: 'Card' },
    { key: 'applePay', label: 'Apple Pay' },
    { key: 'googlePay', label: 'Google Pay' },
    { key: 'tipStaff', label: 'Tips' },
    { key: 'splitBill', label: 'Split bill' },
  ];

  get canTestPayfast() {
    const id = this.merchantId.trim();
    const key = this.merchantKey.trim();
    const phrase = this.passphrase.trim();
    if (!id) return false;
    if (!key && !this.passphraseSet) return false;
    if (!phrase && !this.passphraseSet) return false;
    return true;
  }

  get canContinue() {
    return this.payfastStatus === 'active' && (this.card || this.applePay || this.googlePay);
  }

  get confidenceFact() {
    const labels: string[] = [];
    if (this.payfastStatus === 'active') labels.push('PayFast live');
    if (this.card) labels.push('Card');
    if (this.applePay) labels.push('Apple Pay');
    if (this.googlePay) labels.push('Google Pay');
    if (this.design.tipStaff) labels.push('Tips');
    if (this.design.splitBill) labels.push('Split bill');
    return labels.join(' · ') || 'Nothing on yet';
  }

  ngOnInit() {
    const active = this.ctx.activeExperience();
    if (!active) {
      void this.router.navigate(['/studio/create']);
      return;
    }
    this.venueName = active.venueName || 'Your place';
    this.design = active.guestDesign
      ? { ...defaultDesignForType(active.typeId), ...active.guestDesign }
      : defaultDesignForType(active.typeId);
    this.loadInstall();
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.flashTimer) clearTimeout(this.flashTimer);
  }

  isOn(key: PayOption['key']) {
    if (key === 'card') return this.card;
    if (key === 'applePay') return this.applePay;
    if (key === 'googlePay') return this.googlePay;
    return this.design[key];
  }

  toggle(key: PayOption['key'], ev: Event) {
    const on = (ev.target as HTMLInputElement).checked;
    if (key === 'card') this.card = on;
    else if (key === 'applePay') this.applePay = on;
    else if (key === 'googlePay') this.googlePay = on;
    else this.design = { ...this.design, [key]: on };
    this.scheduleSave();
  }

  testPayfast() {
    this.payfastBusy = true;
    this.payfastError = '';
    this.payfastMessage = '';
    this.api
      .testPaymentConnection({
        connectorId: 'payfast',
        environment: this.payfastEnvironment,
        merchantId: this.merchantId.trim(),
        ...(this.merchantKey.trim() ? { merchantKey: this.merchantKey.trim() } : {}),
        ...(this.passphrase.trim() ? { passphrase: this.passphrase.trim() } : {}),
      })
      .subscribe({
        next: (result) => {
          this.payfastBusy = false;
          this.payfastStatus = 'verified';
          this.passphraseSet = true;
          this.merchantKey = '';
          this.passphrase = '';
          this.payfastMessage = result.businessName
            ? `${result.businessName} verified`
            : 'Credentials verified';
          this.loadInstall();
        },
        error: (err) => {
          this.payfastBusy = false;
          this.payfastError =
            err?.error?.message || 'Could not verify PayFast — check your dashboard credentials';
        },
      });
  }

  activatePayfast() {
    this.payfastBusy = true;
    this.payfastError = '';
    this.payfastMessage = '';
    this.api.activatePaymentConnector().subscribe({
      next: () => {
        this.payfastBusy = false;
        this.payfastStatus = 'active';
        this.payfastMessage = 'PayFast is live — guests can pay';
        this.card = true;
        this.applePay = true;
        this.googlePay = true;
        this.scheduleSave();
        this.loadInstall();
      },
      error: (err) => {
        this.payfastBusy = false;
        this.payfastError = err?.error?.message || 'Could not activate PayFast';
      },
    });
  }

  continue() {
    this.persistPayMethods(true);
    void this.router.navigate(['/studio/setup/golive']);
  }

  private loadInstall() {
    this.api.getPaymentInstall().subscribe({
      next: (install) => {
        if (!install) {
          this.payfastStatus = 'none';
          return;
        }
        if (install.merchantId) this.merchantId = install.merchantId;
        if (install.environment === 'production' || install.environment === 'sandbox') {
          this.payfastEnvironment = install.environment;
        }
        this.passphraseSet = !!install.passphraseSet;
        this.payfastMerchantId = install.merchantId?.trim() || '';
        if (install.status === 'active') {
          this.payfastStatus = 'active';
          this.card = true;
          this.applePay = true;
          this.googlePay = true;
        } else if (install.status === 'verified') {
          this.payfastStatus = 'verified';
        }
      },
      error: () => undefined,
    });
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persistPayMethods(false), 280);
  }

  private persistPayMethods(markDone: boolean) {
    const methods = [
      this.card ? 'Card' : '',
      this.applePay ? 'Apple Pay' : '',
      this.googlePay ? 'Google Pay' : '',
    ].filter(Boolean);
    this.ctx.upsertActive({
      guestDesign: { ...this.design },
      paymentsDone: this.canContinue,
      experienceNotes: methods.length
        ? `${methods.join(' · ')}${this.design.tipStaff ? ' · Tips' : ''}${this.design.splitBill ? ' · Split' : ''}`
        : this.ctx.activeExperience()?.experienceNotes ?? '',
    });
    this.ctx.setLivePayMethods({
      card: this.card,
      applePay: this.applePay,
      googlePay: this.googlePay,
    });
    if (markDone && this.canContinue) this.ctx.markStep('payments');
    this.savedFlash = true;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.savedFlash = false;
    }, 1800);
  }
}
