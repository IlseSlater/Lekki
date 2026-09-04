import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';

/**
 * Batch 6 — former signup wall. Kept as a route so old links still land on the menu.
 * No account, OTP, birthday, or gender steps.
 */
@Component({
  standalone: true,
  selector: 'leos-onboarding-page',
  template: `
    <div class="ob-redirect" role="status" aria-live="polite">
      <p>Taking you to the menu…</p>
    </div>
  `,
  styles: [
    `
      .ob-redirect {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 2rem;
        font-family: 'Sora', system-ui, sans-serif;
        color: var(--leos-ink-secondary, #64748b);
        background: var(--leos-warm-sand, #faf7f2);
      }
      p {
        margin: 0;
      }
    `,
  ],
})
export class OnboardingPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly onboarding = inject(OnboardingService);

  ngOnInit() {
    const qToken = this.route.snapshot.queryParamMap.get('token')?.trim();
    if (qToken) this.onboarding.save({ entryToken: qToken });
    const token = qToken || this.onboarding.read().entryToken;
    if (token) {
      void this.router.navigate(['/splash'], { queryParams: { token }, replaceUrl: true });
      return;
    }
    void this.router.navigate(['/scan'], { replaceUrl: true });
  }
}
