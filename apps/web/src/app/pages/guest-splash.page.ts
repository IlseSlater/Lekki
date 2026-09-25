import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { LeosApiService, SessionStateService } from '../services/leos-api.service';
import { isSameOpenSessionResume } from '../studio/mid-visit-resume';
import { GUEST_SPLASH_MAX_MS, splashWelcomeQuery } from '../studio/guest-entry-gate';

const FIRST_SPLASH_MS = GUEST_SPLASH_MAX_MS;
const RETURN_SPLASH_MS = GUEST_SPLASH_MAX_MS;

/**
 * Brand intro after QR scan — dusk hills, gold mark flows down, then copy.
 * Tap anywhere to skip into the venue experience (landing, then menu).
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
      aria-label="Lekki — continue. Tap to skip."
      (click)="skip()"
      (keydown.enter)="skip()"
      (keydown.space)="skip(); $event.preventDefault()"
    >
      <div class="gs__mark">
        <img
          class="gs__logo"
          src="/brand/lekki-mark.png"
          width="128"
          height="128"
          alt=""
        />
        <p class="gs__word">Lekki.</p>
        <p class="gs__welcome">The human experience app.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .gs {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: grid;
        justify-items: center;
        align-content: start;
        padding-top: 18vh;
        background: transparent;
        overflow: hidden;
        opacity: 1;
        transition: opacity 280ms cubic-bezier(0.22, 1, 0.36, 1);
        cursor: pointer;
      }
      .gs:focus {
        outline: none;
      }
      .gs:focus-visible {
        outline: 2px solid var(--leos-gold, #d7a14a);
        outline-offset: -10px;
      }
      .gs--out {
        opacity: 0;
        pointer-events: none;
      }
      .gs__mark {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.85rem;
      }
      .gs__mark::before {
        content: '';
        position: absolute;
        z-index: 0;
        left: 50%;
        top: 4rem;
        width: 16rem;
        height: 16rem;
        transform: translate(-50%, -50%);
        pointer-events: none;
        background: radial-gradient(ellipse at center, rgba(215, 161, 74, 0.2), transparent 68%);
      }
      .gs__logo {
        position: relative;
        z-index: 1;
        display: block;
        width: 8rem;
        height: 8rem;
        object-fit: contain;
        transform: translateY(-42vh);
        filter: drop-shadow(0 0 16px rgba(215, 161, 74, 0.32))
          drop-shadow(0 10px 24px rgba(215, 161, 74, 0.16));
        animation: gs-flow-down 3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .gs__word,
      .gs__welcome {
        margin: 0;
        font-family: Sora, system-ui, sans-serif;
        opacity: 0;
        animation: gs-copy-in 0.9s 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .gs__word {
        font-size: 1.7rem;
        font-weight: 650;
        letter-spacing: -0.04em;
        color: #fff;
      }
      .gs__welcome {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.62);
      }
      @keyframes gs-flow-down {
        from {
          transform: translateY(-42vh);
        }
        to {
          transform: translateY(0);
        }
      }
      @keyframes gs-copy-in {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .gs {
          transition: none;
        }
        .gs__logo {
          animation: none;
          transform: none;
        }
        .gs__word,
        .gs__welcome {
          animation: none;
          opacity: 1;
          transform: none;
        }
      }
      @media (prefers-contrast: more) {
        .gs__mark::before {
          display: none;
        }
        .gs__logo {
          filter: none;
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
        this.state.menuBrandEnabled = false;
        this.state.brandColour = res.brandColour || '#d7a14a';
        this.state.logoUrl = res.logoUrl || '';
        this.state.menuCoverUrl = '';
        this.state.location = res.location || '';
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
        const welcome = splashWelcomeQuery({ stillIn, returning });
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
