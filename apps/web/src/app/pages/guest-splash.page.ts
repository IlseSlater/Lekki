import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { LeosApiService, SessionStateService } from '../services/leos-api.service';
import { isSameOpenSessionResume } from '../studio/mid-visit-resume';
import { GUEST_SPLASH_MAX_MS } from '../studio/guest-entry-gate';

const FIRST_SPLASH_MS = Math.min(700, GUEST_SPLASH_MAX_MS);
const RETURN_SPLASH_MS = Math.min(500, GUEST_SPLASH_MAX_MS);

/**
 * Brand intro after QR scan — under one second, tap to skip,
 * then straight into the live menu. No onboarding wall.
 */
@Component({
  standalone: true,
  selector: 'leos-guest-splash-page',
  template: `
    <div
      class="gs"
      [class.gs--out]="exiting"
      [class.gs--return]="returningSplash"
      role="button"
      tabindex="0"
      aria-label="Lekki — continue to your menu. Tap to skip."
      (click)="skip()"
      (keydown.enter)="skip()"
      (keydown.space)="skip(); $event.preventDefault()"
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
      <p class="gs__skip" aria-hidden="true">Tap to continue</p>
    </div>
  `,
  styles: [
    `
      .gs {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: var(--leos-warm-sand, #ffffff);
        overflow: hidden;
        opacity: 1;
        transition: opacity 280ms ease;
        cursor: pointer;
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
        transform: scale(1.03);
        animation: gs-in 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
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
        animation: gs-fade 500ms 200ms ease forwards;
      }

      .gs__progress {
        position: absolute;
        left: 12%;
        right: 12%;
        bottom: 12%;
        height: 2px;
        background: rgba(255, 255, 255, 0.35);
        border-radius: 999px;
        overflow: hidden;
      }
      .gs__progress-bar {
        display: block;
        height: 100%;
        width: 0;
        background: #d7a14a;
        animation: gs-bar 700ms linear forwards;
      }
      .gs--return .gs__progress-bar {
        animation-duration: 500ms;
      }

      .gs__skip {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 6%;
        margin: 0;
        text-align: center;
        font-family: 'Sora', system-ui, sans-serif;
        font-size: 0.75rem;
        letter-spacing: 0.04em;
        color: rgba(255, 255, 255, 0.85);
        opacity: 0;
        animation: gs-fade 400ms 350ms ease forwards;
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
      @keyframes gs-bar {
        to {
          width: 100%;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .gs__photo,
        .gs__veil,
        .gs__progress-bar,
        .gs__skip {
          animation: none;
          opacity: 1;
          transform: none;
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
  private finishing = false;

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
    const returning = this.onboarding.isReturningGuest();
    const midVisit = !!(this.state.sessionId?.trim() && this.state.participantId?.trim());
    this.returningSplash = returning || midVisit;

    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = this.returningSplash ? (reduced ? 0 : RETURN_SPLASH_MS) : reduced ? 0 : FIRST_SPLASH_MS;
    if (ms === 0) {
      void this.finish();
      return;
    }
    this.timer = setTimeout(() => void this.finish(), ms);
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  skip() {
    void this.finish();
  }

  private async finish() {
    if (this.finishing) return;
    this.finishing = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.exiting = true;
    await new Promise((r) => setTimeout(r, this.returningSplash ? 180 : 240));
    this.resolveAndEnter();
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
        this.state.menuBrandEnabled = !!res.menuBrandEnabled;
        this.state.brandColour = res.brandColour || '#d7a14a';
        this.state.participantId = res.joinedParticipantId ?? '';
        if (res.participantSecret) this.state.participantSecret = res.participantSecret;
        if (res.guestDesign && typeof res.guestDesign === 'object') {
          this.state.guestDesign = res.guestDesign;
        } else {
          this.state.guestDesign = null;
        }
        if (res.currency) this.state.currency = res.currency;
        this.state.token = this.token;
        this.state.displayName = displayName;
        this.state.persist();
        this.onboarding.save({ completed: true, entryToken: this.token });
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
        // No signup wall — retry through Entry join.
        void this.router.navigate(['/entry'], {
          queryParams: { token: this.token, join: '1' },
        });
      },
    });
  }
}
