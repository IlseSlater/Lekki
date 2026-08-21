import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { LeosApiService, SessionStateService } from '../services/leos-api.service';
import { OnboardingService } from '../services/onboarding.service';
import { isSameOpenSessionResume } from '../studio/mid-visit-resume';

type EntryStep = 'missing' | 'welcome' | 'join' | 'loading' | 'redirect' | 'done';

const DEMO_VENUES: Array<{ token: string; title: string; desc: string }> = [
  { token: 'qr-demo-restaurant', title: 'Restaurant', desc: 'Engineering demo only' },
  { token: 'qr-demo-cafe', title: 'Café', desc: 'Engineering demo only' },
  { token: 'qr-demo-hotel', title: 'Hotel', desc: 'Engineering demo only' },
  { token: 'qr-demo-festival', title: 'Festival', desc: 'Engineering demo only' },
  { token: 'qr-demo-airport', title: 'Airport', desc: 'Engineering demo only' },
  { token: 'qr-demo-healthcare', title: 'Healthcare', desc: 'Engineering demo only' },
];

/**
 * LEOS Experience Entry — QR deep links hand off to guest onboarding,
 * then load Experience. Demo gallery only with ?demo=1.
 */
@Component({
  standalone: true,
  imports: [FormsModule, ExperienceScreenComponent],
  template: `
    <leos-experience-screen
      [purpose]="purpose"
      [lead]="lead"
      [help]="help"
      [showFooter]="showFooter"
    >
      @if (error) {
        <p class="leos-error-banner" role="alert">{{ error }}</p>
      }

      @if (step === 'redirect' || step === 'loading') {
        <div class="leos-arrival studio-motion-appear" aria-live="polite">
          <p class="leos-arrival__reassure">
            {{
              step === 'redirect'
                ? returning
                  ? 'Welcome back — one moment…'
                  : 'Welcome — one moment…'
                : 'Finding your place…'
            }}
          </p>
          <p class="leos-muted">
            {{ returning ? 'Good to see you again.' : 'You’re joining the right experience.' }}
          </p>
        </div>
      }

      @if (step === 'done') {
        <div class="leos-arrival studio-motion-appear">
          <p class="leos-arrival__reassure">
            You’re finished{{ guestFirstName ? ', ' + guestFirstName : '' }}.
          </p>
          <p class="leos-muted">
            @if (lastVenue) {
              Thanks for visiting {{ lastVenue }}. Scan again when you’re ready — we’ll welcome you back.
            } @else {
              Thanks for joining us. Scan again when you’re ready — we’ll welcome you back.
            }
          </p>
        </div>
      }

      @if (step === 'missing') {
        <p class="leos-muted">Scan the QR at your place — we’ll take you straight in. No account needed.</p>
        <p style="margin-top:1rem;">
          <a class="leos-btn leos-btn--primary" href="/scan">Scan QR code</a>
        </p>
        @if (demoMode) {
          <p class="leos-muted" style="margin-top:1rem;">Engineering demo — pick a seed:</p>
          <div class="leos-visual-cards leos-visual-cards--two" style="margin-top:0.75rem;">
            @for (v of venues; track v.token) {
              <button type="button" class="leos-visual-card" (click)="pickDemo(v.token)">
                <p class="leos-visual-card__title">{{ v.title }}</p>
                <p class="leos-visual-card__desc">{{ v.desc }}</p>
              </button>
            }
          </div>
        }
      }

      @if (step === 'welcome') {
        <div class="leos-arrival studio-motion-appear">
          <p class="leos-arrival__eyebrow">{{ state.profileLabel || 'Welcome' }}</p>
          @if (state.physicalContextCode) {
            <p class="leos-arrival__place">
              {{ termsPhysical }}
              <strong>{{ state.physicalContextCode }}</strong>
            </p>
          }
          @if (stillIn) {
            <p class="leos-arrival__reassure">
              You’re still in{{ guestFirstName ? ', ' + guestFirstName : '' }}.
            </p>
            <p class="leos-muted">
              @if (state.venueName) {
                {{ state.venueName }} — pick up where you left off.
              } @else if (state.physicalContextCode) {
                {{ termsPhysical }}
                <strong>{{ state.physicalContextCode }}</strong>
                — pick up where you left off.
              } @else {
                Pick up where you left off.
              }
            </p>
          } @else if (returning) {
            <p class="leos-arrival__reassure">
              Ready when you are{{ guestFirstName ? ', ' + guestFirstName : '' }}.
            </p>
            <p class="leos-muted">
              @if (state.venueName) {
                {{ state.venueName }} — the team is ready.
              } @else {
                The team is ready when you are.
              }
            </p>
          } @else {
            <p class="leos-arrival__reassure">
              You’re in{{ guestFirstName ? ', ' + guestFirstName : '' }}.
            </p>
            <p class="leos-muted">
              @if (state.physicalContextCode) {
                {{ termsPhysical }}
                <strong>{{ state.physicalContextCode }}</strong>
                — the team can see you. Browse when you’re ready.
              } @else {
                The team can see you. Browse when you’re ready.
              }
            </p>
          }
        </div>
      }

      @if (step === 'join') {
        <div class="leos-arrival studio-motion-appear" style="margin-bottom:1.25rem;">
          <p class="leos-arrival__reassure">Almost there.</p>
          <p class="leos-muted">One name so we can welcome you properly.</p>
        </div>
        <div class="leos-field">
          <span class="leos-field__label">What should we call you?</span>
          <input
            class="leos-field__input"
            name="displayName"
            [(ngModel)]="state.displayName"
            autocomplete="nickname"
            autofocus
            (keydown.enter)="enterExperience()"
          />
        </div>
      }

      @if (step === 'done') {
        <button primary type="button" class="leos-btn leos-btn--primary" (click)="goScan()">
          Scan to return
        </button>
      }
      @if (step === 'welcome') {
        <button primary type="button" class="leos-btn leos-btn--primary" (click)="enterExperience()">
          {{ stillIn || returning ? 'Continue' : seeCatalogueCta }}
        </button>
      }
      @if (step === 'join') {
        <button primary type="button" class="leos-btn leos-btn--primary" (click)="enterExperience()">
          Join
        </button>
      }
    </leos-experience-screen>
  `,
})
export class EntryPageComponent {
  private readonly api = inject(LeosApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly onboarding = inject(OnboardingService);
  readonly state = inject(SessionStateService);
  readonly venues = DEMO_VENUES;

  step: EntryStep = 'missing';
  error = '';
  demoMode = false;
  returning = false;
  /** Mid-visit restore on Entry welcome — not Join, not Welcome back. */
  stillIn = false;
  lastVenue = '';
  private resolving = false;

  constructor() {
    this.state.restore();
    this.returning = this.onboarding.isReturningGuest();
    this.lastVenue = this.onboarding.read().lastVenueLabel || '';
    this.demoMode = this.route.snapshot.queryParamMap.get('demo') === '1';
    const pathToken = this.route.snapshot.paramMap.get('token')?.trim();
    const q = this.route.snapshot.queryParamMap.get('token')?.trim() || pathToken;
    const skipOnboarding = this.route.snapshot.queryParamMap.get('join') === '1';
    const visitDone = this.route.snapshot.queryParamMap.get('done') === '1';

    if (visitDone && !q) {
      this.step = 'done';
      return;
    }

    if (q) {
      this.state.token = q;
      this.onboarding.save({ entryToken: q });

      // Printed / shared QR → brand splash, then onboarding or experience
      if (!skipOnboarding) {
        this.step = 'redirect';
        void this.router.navigate(['/splash'], { queryParams: { token: q } });
        return;
      }

      // Returning guest who already finished personal onboarding
      const profile = this.onboarding.read();
      if (profile.name) this.state.displayName = profile.name;
      this.returning = this.onboarding.isReturningGuest();
      void this.beginWithToken(q, true);
      return;
    }

    if (this.demoMode) {
      this.step = 'missing';
    } else if (this.state.sessionId && this.state.profileLabel) {
      this.step = 'welcome';
      this.stillIn = !!(this.state.participantId?.trim());
      this.returning = this.onboarding.isReturningGuest() && !this.stillIn;
      // One greeting — Entry claims it so Experience does not stack another.
      if (this.stillIn) this.onboarding.consumeResumeGreeting();
      else if (this.returning) this.onboarding.consumeReturnGreeting();
      if (this.state.sessionId) this.onboarding.noteOpenSession(this.state.sessionId);
    } else {
      this.step = 'missing';
    }
  }

  get guestFirstName(): string {
    return this.onboarding.firstName() || (this.state.displayName || '').trim().split(/\s+/)[0] || '';
  }

  get termsPhysical(): string {
    return this.state.terminology['physicalContext'] ?? 'Place';
  }

  get seeCatalogueCta(): string {
    const catalogue = (this.state.terminology['catalogue'] ?? 'menu').toLowerCase();
    return `See the ${catalogue}`;
  }

  get purpose(): string {
    switch (this.step) {
      case 'join':
        return 'Welcome';
      case 'loading':
      case 'redirect':
        return 'Welcome';
      case 'done':
        return 'Visit complete';
      case 'missing':
        return 'Scan to join';
      case 'welcome':
        return this.state.profileLabel || 'Welcome';
      default:
        return 'Welcome';
    }
  }

  get lead(): string {
    switch (this.step) {
      case 'join':
        return '';
      case 'missing':
        return this.demoMode
          ? 'Engineering demo — guests arrive via QR only.'
          : 'Open this page from the QR at your place.';
      case 'done':
        return '';
      case 'welcome':
        return '';
      default:
        return '';
    }
  }

  get help(): string {
    return '';
  }

  get showFooter(): boolean {
    return this.step === 'welcome' || this.step === 'join' || this.step === 'done';
  }

  goScan() {
    void this.router.navigate(['/scan']);
  }

  pickDemo(token: string) {
    this.state.token = token;
    this.onboarding.save({ entryToken: token });
    void this.router.navigate(['/splash'], { queryParams: { token } });
  }

  private beginWithToken(token: string, autoEnter = false) {
    if (this.resolving) return;
    this.resolving = true;
    this.step = 'loading';
    this.error = '';
    const profile = this.onboarding.read();
    const displayName =
      this.state.displayName?.trim() && this.state.displayName !== 'Guest'
        ? this.state.displayName.trim()
        : profile.name?.trim() || 'Guest';
    const priorSessionId = this.state.sessionId;
    const priorParticipantId = this.state.participantId;
    this.api
      .resolveEntry(this.state.entryBody(token.trim(), displayName))
      .subscribe({
        next: (res) => {
          this.state.sessionId = res.session.id;
          this.state.organisationId = res.session.organisationId;
          this.state.venueId = res.session.venueId;
          this.state.terminology = res.context.profile.terminology ?? {};
          this.state.profileLabel = res.context.profile.label ?? '';
          this.state.profileId = res.session.profileId ?? res.context.profile.id ?? '';
          this.state.physicalContextCode = res.context.physicalContextCode ?? '';
          this.state.venueName = res.venueName ?? '';
          this.state.token = token.trim();
          this.state.displayName = displayName;
          this.state.participantId = res.joinedParticipantId ?? '';
          this.state.persist();
          this.api.connectSocket(this.state.organisationId, this.state.sessionId);
          this.resolving = false;
          const stillIn = isSameOpenSessionResume(
            priorSessionId,
            priorParticipantId,
            res.session.id,
          );
          this.stillIn = stillIn;
          this.returning = this.onboarding.isReturningGuest() && !stillIn;
          if (autoEnter) {
            if (stillIn) this.onboarding.noteOpenSession(res.session.id);
            const welcome = stillIn ? 'still' : this.returning ? 'back' : undefined;
            void this.router.navigate(['/experience'], {
              queryParams: welcome ? { welcome } : {},
            });
            return;
          }
          this.step = 'welcome';
          if (stillIn) {
            this.onboarding.consumeResumeGreeting();
            this.onboarding.noteOpenSession(res.session.id);
          } else if (this.returning) {
            this.onboarding.consumeReturnGreeting();
          }
        },
        error: (err) => {
          this.resolving = false;
          this.step = 'missing';
          this.error =
            err?.error?.message ?? err?.message ?? 'Could not join — check the QR and try again.';
        },
      });
  }

  enterExperience() {
    this.state.displayName = this.state.displayName.trim() || 'Guest';
    this.state.persist();
    // Entry already claimed the once-per-tab greeting — don’t stack Experience banner.
    void this.router.navigate(['/experience'], {
      queryParams: this.stillIn || this.returning ? {} : { joined: '1' },
    });
  }
}
