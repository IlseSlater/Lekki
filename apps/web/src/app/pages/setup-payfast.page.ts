import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfidenceIndicatorComponent } from '../leos/confidence-indicator.component';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { LeosApiService } from '../services/leos-api.service';
import { StudioContextService } from '../services/studio-context.service';

/**
 * Connect PayFast — real /ping probe via POST /setup/payments/test-connection.
 * Success vaults merchant key + passphrase; then activates for guests.
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
      purpose="Connect PayFast"
      lead="Enable secure, local payments for your guests."
      [showFooter]="true"
    >
      <div config class="pf">
        <label class="pf__field">
          <span class="pf__label">Environment</span>
          <select class="leos-field__input" [(ngModel)]="environment" [disabled]="busy">
            <option value="sandbox">Sandbox</option>
            <option value="production">Live</option>
          </select>
        </label>
        <label class="pf__field">
          <span class="pf__label">Merchant ID</span>
          <input
            class="leos-field__input"
            autocomplete="off"
            [(ngModel)]="merchantId"
            [disabled]="busy"
          />
        </label>
        <label class="pf__field">
          <span class="pf__label">Merchant key</span>
          <input
            class="leos-field__input"
            type="password"
            autocomplete="new-password"
            [(ngModel)]="merchantKey"
            [disabled]="busy"
            [placeholder]="keySet ? 'Leave blank to keep saved key' : ''"
          />
        </label>
        <label class="pf__field">
          <span class="pf__label">Passphrase <em>(required)</em></span>
          <input
            class="leos-field__input"
            type="password"
            autocomplete="new-password"
            [(ngModel)]="passphrase"
            [disabled]="busy"
            [placeholder]="passphraseSet ? 'Leave blank to keep saved passphrase' : ''"
          />
        </label>

        @if (error) {
          <p class="pf__error" role="alert">{{ error }}</p>
        }
        @if (message) {
          <p class="pf__ok" role="status">{{ message }}</p>
        }

        <p class="pf__hint">
          We verify your Merchant ID and passphrase with PayFast. Your merchant key is stored
          securely for checkout.
        </p>
      </div>

      <leos-confidence-indicator
        confidence
        eyebrow="Guests will see"
        fact="Pay with card at the table"
        [detail]="venueName"
        [ready]="status === 'active'"
        okLabel="PayFast is live"
        waiting="Test connection to verify Merchant & Passphrase"
      />

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/integrations">Back</a>
      <button
        primary
        type="button"
        class="leos-btn leos-btn--primary"
        [disabled]="busy || !canSubmit"
        (click)="testAndSave()"
      >
        {{ busy ? 'Verifying…' : 'Test Connection & Save' }}
      </button>
    </leos-experience-screen>
  `,
  styles: [
    `
      .pf__field {
        display: grid;
        gap: 0.35rem;
        margin-bottom: 0.7rem;
      }
      .pf__label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--studio-ink, #1b2230);
      }
      .pf__label em {
        font-style: normal;
        font-weight: 500;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .pf__error {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        color: #b42318;
      }
      .pf__ok {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #4f8a6b;
      }
      .pf__hint {
        margin: 0.5rem 0 0;
        font-size: 0.8125rem;
        color: var(--studio-ink-secondary, #6b7280);
        line-height: 1.4;
      }
    `,
  ],
})
export class SetupPayfastPageComponent implements OnInit {
  private readonly api = inject(LeosApiService);
  private readonly ctx = inject(StudioContextService);
  private readonly router = inject(Router);

  venueName = '';
  merchantId = '';
  merchantKey = '';
  passphrase = '';
  environment: 'sandbox' | 'production' = 'sandbox';
  status: 'none' | 'verified' | 'active' = 'none';
  keySet = false;
  passphraseSet = false;
  busy = false;
  error = '';
  message = '';

  get canSubmit() {
    if (!this.merchantId.trim()) return false;
    if (!this.merchantKey.trim() && !this.keySet) return false;
    if (!this.passphrase.trim() && !this.passphraseSet) return false;
    return true;
  }

  ngOnInit() {
    const active = this.ctx.activeExperience();
    this.venueName = active?.venueName || this.ctx.displayVenue() || 'Your place';
    this.api.getPaymentInstall().subscribe({
      next: (install) => {
        if (!install) return;
        if (install.merchantId) this.merchantId = install.merchantId;
        if (install.environment === 'production' || install.environment === 'sandbox') {
          this.environment = install.environment;
        }
        this.passphraseSet = !!install.passphraseSet;
        this.keySet = !!install.passphraseSet; // key vaulted with same flow
        if (install.status === 'active') this.status = 'active';
        else if (install.status === 'verified') this.status = 'verified';
      },
    });
  }

  testAndSave() {
    if (!this.canSubmit || this.busy) return;
    this.busy = true;
    this.error = '';
    this.message = '';
    const body: {
      connectorId: string;
      environment: 'sandbox' | 'production';
      merchantId: string;
      merchantKey?: string;
      passphrase?: string;
    } = {
      connectorId: 'payfast',
      environment: this.environment,
      merchantId: this.merchantId.trim(),
    };
    if (this.merchantKey.trim()) body.merchantKey = this.merchantKey.trim();
    if (this.passphrase.trim()) body.passphrase = this.passphrase.trim();

    this.api.testPaymentConnection(body).subscribe({
      next: (result) => {
        this.message =
          result.merchantStatus ||
          result.businessName ||
          'Verified Merchant & Passphrase';
        this.merchantKey = '';
        this.passphrase = '';
        this.passphraseSet = true;
        this.keySet = true;
        this.api.activatePaymentConnector().subscribe({
          next: () => {
            this.busy = false;
            this.status = 'active';
            this.ctx.upsertActive({ paymentsDone: true });
            void this.router.navigate(['/studio/integrations'], {
              queryParams: { payfast: 'verified' },
            });
          },
          error: (err) => {
            this.busy = false;
            this.status = 'verified';
            this.error =
              err?.error?.message ||
              'Verified with PayFast, but activation failed — try again';
          },
        });
      },
      error: (err) => {
        this.busy = false;
        this.error =
          err?.error?.message ||
          'Could not verify credentials with PayFast. Please check your details.';
      },
    });
  }
}
