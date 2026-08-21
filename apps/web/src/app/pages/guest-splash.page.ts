import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { LeosApiService, SessionStateService } from '../services/leos-api.service';
import { isSameOpenSessionResume } from '../studio/mid-visit-resume';

const FIRST_SPLASH_MS = 5000;
const RETURN_SPLASH_MS = 1400;

/**
 * Brand intro after QR scan — hospitality splash,
 * then new-user onboarding or returning-guest experience.
 * Returning guests get a shorter beat (not the same first-run wait).
 */
@Component({
  standalone: true,
  selector: 'leos-guest-splash-page',
  template: `
    <div
      class="gs"
      [class.gs--out]="exiting"
      [class.gs--return]="returningSplash"
      role="img"
      aria-label="Lekki — The human experience app. Every great experience begins with confidence."
    >
      <img
        class="gs__photo"
        src="/brand/lekki-intro-splash.jpg"
        alt="Lekki — The human experience app"
        decoding="async"
      />
      <div class="gs__veil" aria-hidden="true"></div>
      <div class="gs__progress" aria-hidden="true">
        <span class="gs__progress-bar"></span>
      </div>
    </div>
  `,
  styles: [
    `
      .gs {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: var(--leos-warm-sand, #faf7f2);
        overflow: hidden;
        opacity: 1;
        transition: opacity 420ms ease;
      }
      .gs--out {
        opacity: 0;
        pointer-events: none;
      }

      .gs__photo {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
        opacity: 0;
        transform: scale(1.04);
        animation: gs-in 1100ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .gs__veil {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse at 50% 35%,
          transparent 35%,
          rgba(250, 247, 242, 0.35) 100%
        );
        pointer-events: none;
        opacity: 0;
        animation: gs-fade 800ms 400ms ease forwards;
      }

      .gs__progress {
        position: absolute;
        left: 50%;
        bottom: max(1.75rem, env(safe-area-inset-bottom, 0px) + 1rem);
        transform: translateX(-50%);
        width: min(11rem, 42vw);
        height: 2px;
        border-radius: 999px;
        background: rgba(215, 161, 74, 0.22);
        overflow: hidden;
        z-index: 2;
        opacity: 0;
        animation: gs-fade 500ms 900ms ease forwards;
      }

      .gs__progress-bar {
        display: block;
        height: 100%;
        width: 0;
        border-radius: inherit;
        background: linear-gradient(90deg, #c98f33, #e8c178, #fff4d6, #d7a14a);
        box-shadow: 0 0 12px rgba(215, 161, 74, 0.45);
        animation: gs-progress 3800ms 1000ms linear forwards;
      }

      .gs--return .gs__photo {
        animation-duration: 600ms;
      }
      .gs--return .gs__veil {
        animation-delay: 120ms;
        animation-duration: 400ms;
      }
      .gs--return .gs__progress {
        animation-delay: 200ms;
        animation-duration: 300ms;
      }
      .gs--return .gs__progress-bar {
        animation: gs-progress 900ms 250ms linear forwards;
      }

      @keyframes gs-in {
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      @keyframes gs-fade {
        to {
          opacity: 1;
        }
      }
      @keyframes gs-progress {
        to {
          width: 100%;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .gs__photo,
        .gs__veil,
        .gs__progress,
        .gs__progress-bar {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
        .gs__progress-bar {
          width: 100%;
        }
      }
    `,
  ],
})
export class GuestSplashPageComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly onboarding = inject(OnboardingService);
  private readonly api = inject(LeosApiService);
  private readonly state = inject(SessionStateService);

  exiting = false;
  returningSplash = false;
  private timer?: ReturnType<typeof setTimeout>;
  private token = '';

  ngOnInit() {
    const qToken = this.route.snapshot.queryParamMap.get('token')?.trim();
    if (qToken) {
      this.onboarding.save({ entryToken: qToken });
      this.token = qToken;
    } else {
      this.token = this.onboarding.read().entryToken;
    }

    if (!this.token) {
      void this.router.navigate(['/scan']);
      return;
    }

    this.state.restore();
    const canEnter = this.onboarding.canEnterExperience();
    const returning = canEnter && this.onboarding.isReturningGuest();
    const midVisit =
      canEnter && !!(this.state.sessionId?.trim() && this.state.participantId?.trim());
    // Short beat for return or mid-visit resume — not first-run wait.
    this.returningSplash = returning || midVisit;

    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = this.returningSplash ? (reduced ? 0 : RETURN_SPLASH_MS) : FIRST_SPLASH_MS;
    if (ms === 0) {
      void this.finish();
      return;
    }
    this.timer = setTimeout(() => void this.finish(), ms);
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  private async finish() {
    this.exiting = true;
    await new Promise((r) => setTimeout(r, this.returningSplash ? 280 : 420));

    if (this.onboarding.canEnterExperience()) {
      this.resolveAndEnter();
      return;
    }

    void this.router.navigate(['/onboarding'], { queryParams: { token: this.token } });
  }

  private resolveAndEnter() {
    const profile = this.onboarding.read();
    const displayName = profile.name.trim() || 'Guest';
    const priorSessionId = this.state.sessionId;
    const priorParticipantId = this.state.participantId;
    const returning = this.onboarding.isReturningGuest();
    this.api.resolveEntry(this.state.entryBody(this.token, displayName)).subscribe({
      next: (res) => {
        this.state.sessionId = res.session.id;
        this.state.organisationId = res.session.organisationId;
        this.state.venueId = res.session.venueId;
        this.state.terminology = res.context.profile.terminology ?? {};
        this.state.profileLabel = res.context.profile.label ?? '';
        this.state.profileId = res.session.profileId ?? res.context.profile.id ?? '';
        this.state.physicalContextCode = res.context.physicalContextCode ?? '';
        this.state.venueName = res.venueName ?? '';
        this.state.participantId = res.joinedParticipantId ?? '';
        this.state.token = this.token;
        this.state.displayName = displayName;
        this.state.persist();
        this.api.connectSocket(this.state.organisationId, this.state.sessionId);
        const stillIn = isSameOpenSessionResume(
          priorSessionId,
          priorParticipantId,
          res.session.id,
        );
        if (stillIn) this.onboarding.noteOpenSession(res.session.id);
        const welcome = stillIn ? 'still' : returning ? 'back' : undefined;
        void this.router.navigate(['/experience'], {
          queryParams: welcome ? { welcome } : {},
        });
      },
      error: () => {
        void this.router.navigate(['/onboarding'], { queryParams: { token: this.token } });
      },
    });
  }
}
