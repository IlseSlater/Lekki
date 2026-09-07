import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { LeosApiService } from '../services/leos-api.service';
import { StudioContextService } from '../services/studio-context.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Studio Integrations hub — Payment Gateway + POS cards.
 * One question: Which connection do you want to manage?
 */
@Component({
  standalone: true,
  imports: [ExperienceScreenComponent, RouterLink],
  template: `
    <leos-experience-screen
      purpose="Integrations"
      lead="Connect payments and your till — guests feel it immediately."
      [showFooter]="true"
    >
      <div config class="int-hub">
        @if (showPayfast) {
          <a
            class="int-card"
            [class.int-card--muted]="payfastMuted"
            routerLink="/studio/integrations/payfast"
          >
            <span class="int-card__eyebrow">Payment gateway</span>
            <span class="int-card__title">PayFast</span>
            <span class="int-card__status" [class.int-card__status--ok]="payfastOk">{{
              payfastLabel
            }}</span>
            @if (payfastMuted) {
              <span class="int-card__note">Settlement is on the Pilot till</span>
            }
          </a>
        }
        <a class="int-card" routerLink="/studio/integrations/pilot">
          <span class="int-card__eyebrow">Point of sale</span>
          <span class="int-card__title">Pilot</span>
          <span class="int-card__status" [class.int-card__status--ok]="pilotOk">{{
            pilotLabel
          }}</span>
        </a>
      </div>

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio">Back to Studio</a>
      <a primary class="leos-btn leos-btn--primary" routerLink="/studio/setup/payments"
        >How guests pay</a
      >
    </leos-experience-screen>
  `,
  styles: [
    `
      .int-hub {
        display: grid;
        gap: 0.85rem;
      }
      .int-card {
        display: grid;
        gap: 0.25rem;
        padding: 1.1rem 1.15rem;
        border-radius: 12px;
        border: 1px solid var(--studio-line, #e7e2db);
        background: #fff;
        text-decoration: none;
        color: inherit;
        transition: border-color 160ms ease-out, box-shadow 160ms ease-out;
      }
      .int-card:hover {
        border-color: #d7a14a;
        box-shadow: 0 8px 24px rgba(27, 34, 48, 0.06);
      }
      .int-card--muted {
        opacity: 0.72;
      }
      .int-card__eyebrow {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .int-card__title {
        font-size: 1.15rem;
        font-weight: 650;
        color: var(--studio-ink, #1b2230);
      }
      .int-card__status {
        font-size: 0.875rem;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .int-card__status--ok {
        color: #4f8a6b;
        font-weight: 600;
      }
      .int-card__note {
        font-size: 0.75rem;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
    `,
  ],
})
export class SetupIntegrationsPageComponent implements OnInit {
  private readonly api = inject(LeosApiService);
  private readonly ctx = inject(StudioContextService);
  private readonly router = inject(Router);

  payfastLabel = 'Not configured';
  payfastOk = false;
  payfastMuted = false;
  showPayfast = true;
  pilotLabel = 'Not configured';
  pilotOk = false;

  ngOnInit() {
    if (!this.ctx.hasExperiences()) {
      void this.router.navigate(['/studio/create']);
      return;
    }
    const venueId = this.ctx.activeExperience()?.venueId?.trim() || '';

    const payfast$ = this.api.getPaymentInstall().pipe(catchError(() => of(null)));
    const pilot$ = venueId
      ? this.api.getPosInstall(venueId).pipe(catchError(() => of(null)))
      : of(null);

    forkJoin({ payfast: payfast$, pilot: pilot$ }).subscribe(({ payfast, pilot }) => {
      if (!payfast) {
        this.payfastLabel = 'Not configured';
        this.payfastOk = false;
      } else if (payfast.status === 'active') {
        this.payfastLabel = payfast.merchantId
          ? `Active: PayFast · ${payfast.merchantId}`
          : 'Active: PayFast';
        this.payfastOk = true;
      } else if (payfast.status === 'verified') {
        this.payfastLabel =
          payfast.merchantStatus?.trim() || 'Verified Merchant & Passphrase';
        this.payfastOk = true;
      } else {
        this.payfastLabel = 'Draft — finish connecting PayFast';
        this.payfastOk = false;
      }

      if (!pilot) {
        this.pilotLabel = venueId
          ? 'Not configured'
          : 'Set venue in Setup first';
        this.pilotOk = false;
        return;
      }
      if (pilot.status === 'active') {
        this.pilotOk = true;
        this.pilotLabel =
          pilot.settlementOwner === 'pos'
            ? 'Active · till settles guests'
            : 'Active · Lekki settles guests';
        this.payfastMuted = pilot.settlementOwner === 'pos';
      } else {
        this.pilotLabel = 'Not configured';
        this.pilotOk = false;
      }
    });
  }
}
