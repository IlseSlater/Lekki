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
 * Setup — How guests pay (thin gateway).
 * Guest checkout toggles here; PayFast credentials live under Integrations.
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
          <h3 class="pay-section__title">Payment connection</h3>
          <p
            class="pay-section__status"
            [class.pay-section__status--ok]="payfastStatus === 'active'"
            role="status"
          >
            {{ payfastStatusLabel }}
          </p>
          <a class="pay-section__link" routerLink="/studio/integrations/payfast"
            >Manage PayFast integration</a
          >
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
        waiting="Connect PayFast, then turn on at least one checkout method"
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
      .pay-section__status {
        margin: 0 0 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .pay-section__status--ok {
        color: #4f8a6b;
      }
      .pay-section__link {
        font-size: 0.875rem;
        font-weight: 600;
        color: #d7a14a;
        text-decoration: none;
      }
      .pay-section__link:hover {
        text-decoration: underline;
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
  payfastStatus: 'none' | 'verified' | 'active' = 'none';
  payfastMerchantId = '';

  readonly options: PayOption[] = [
    { key: 'payAtTable', label: 'Pay at table' },
    { key: 'card', label: 'Card' },
    { key: 'applePay', label: 'Apple Pay' },
    { key: 'googlePay', label: 'Google Pay' },
    { key: 'tipStaff', label: 'Tips' },
    { key: 'splitBill', label: 'Split bill' },
  ];

  get payfastStatusLabel() {
    if (this.payfastStatus === 'active') {
      return this.payfastMerchantId
        ? `PayFast: Active · ${this.payfastMerchantId}`
        : 'PayFast: Active';
    }
    if (this.payfastStatus === 'verified') return 'PayFast: Verified — activate in Integrations';
    return 'PayFast: Not configured';
  }

  get canContinue() {
    const methodsOk = this.card || this.applePay || this.googlePay;
    if (this.design.payAtTable) {
      return this.payfastStatus === 'active' && methodsOk;
    }
    return methodsOk;
  }

  get confidenceFact() {
    const labels: string[] = [];
    if (this.payfastStatus === 'active') labels.push('PayFast live');
    if (this.design.payAtTable) labels.push('Pay at table');
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
