import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudioAuthService } from '../services/studio-auth.service';
import { StudioContextService } from '../services/studio-context.service';

/**
 * Lekki website → LEOS Studio sign-in.
 * Google / Apple / email create an account, then Studio Setup opens.
 */
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  selector: 'leos-studio-signin',
  template: `
    <div class="si">
      <a class="si-back" routerLink="/">← Lekki</a>

      <section class="si-card">
        <img class="si-logo" src="/brand/lekki-mark.svg" alt="Lekki" />
        <p class="si-wordmark">Lekki</p>
        <h1 class="si-title">Sign into LEOS Studio</h1>
        <p class="si-lead">
          Create your account with Google or social login — then set up your experience.
        </p>

        <button type="button" class="si-social" [disabled]="busy" (click)="signInGoogle()">
          <span class="si-social__g" aria-hidden="true">G</span>
          Continue with Google
        </button>
        <button type="button" class="si-social" [disabled]="busy" (click)="signInApple()">
          <span class="si-social__apple" aria-hidden="true"></span>
          Continue with Apple
        </button>

        <p class="si-or"><span>or</span></p>

        <label class="si-field">
          <span>Work email</span>
          <input
            type="email"
            name="email"
            autocomplete="email"
            [(ngModel)]="email"
            placeholder="you@venue.com"
            (keydown.enter)="signInEmail()"
          />
        </label>

        @if (error) {
          <p class="si-error" role="alert">{{ error }}</p>
        }

        <button
          type="button"
          class="si-btn"
          [disabled]="busy || !emailValid"
          (click)="signInEmail()"
        >
          @if (busy) {
            Creating your Studio account…
          } @else {
            Continue with email
          }
        </button>

        <p class="si-legal">
          By continuing you agree to Lekki Terms and Privacy. Guests joining via QR never see this
          screen.
        </p>
      </section>
    </div>
  `,
  styles: [
    `
      .si {
        --si-bg: #faf7f2;
        --si-ink: #1b2230;
        --si-muted: #6b7280;
        --si-brand: #d7a14a;
        --si-brand-hover: #c98f33;
        --si-line: #e7e2db;
        --si-sans: 'Sora', system-ui, sans-serif;
        --si-display: 'Fraunces', Georgia, serif;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 2rem 1.25rem;
        background: linear-gradient(180deg, #faf7f2 0%, #f2e4cf 100%);
        color: var(--si-ink);
        font-family: var(--si-sans);
      }
      .si-back {
        position: absolute;
        top: 1.25rem;
        left: 1.25rem;
        color: var(--si-muted);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 550;
      }
      .si-card {
        width: min(100%, 26rem);
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid var(--si-line);
        border-radius: 1.5rem;
        padding: 2rem 1.5rem 1.75rem;
        box-shadow: 0 20px 50px rgba(26, 20, 16, 0.06);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .si-logo {
        height: 3.25rem;
        width: auto;
        align-self: center;
        margin: 0.25rem 0 0;
      }
      .si-wordmark {
        margin: 0;
        text-align: center;
        font-family: var(--si-sans);
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: var(--si-ink);
      }
      .si-title {
        margin: 0.35rem 0 0;
        font-family: var(--si-display);
        font-size: 1.85rem;
        letter-spacing: -0.03em;
        text-align: center;
      }
      .si-lead {
        margin: 0 0 0.75rem;
        color: var(--si-muted);
        line-height: 1.45;
        font-size: 0.9375rem;
        text-align: center;
      }
      .si-social {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;
        min-height: 3.1rem;
        border: 1px solid var(--si-line);
        border-radius: 999px;
        background: #fff;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      .si-social:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .si-social__g {
        color: #4285f4;
        font-weight: 700;
      }
      .si-social__apple {
        width: 0.9rem;
        height: 0.9rem;
        border-radius: 999px;
        background: #111;
      }
      .si-or {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 0.75rem;
        margin: 0.5rem 0;
        color: var(--si-muted);
        font-size: 0.8125rem;
      }
      .si-or::before,
      .si-or::after {
        content: '';
        height: 1px;
        background: var(--si-line);
      }
      .si-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--si-muted);
      }
      .si-field input {
        min-height: 3rem;
        border: 1px solid var(--si-line);
        border-radius: 12px;
        padding: 0.75rem 1rem;
        font: inherit;
        font-weight: 500;
        color: var(--si-ink);
        background: #fff;
      }
      .si-btn {
        min-height: 3.15rem;
        margin-top: 0.35rem;
        border: 0;
        border-radius: 999px;
        background: var(--si-brand);
        color: #fff;
        font: inherit;
        font-weight: 650;
        cursor: pointer;
        box-shadow: 0 10px 30px rgba(45, 30, 15, 0.08);
      }
      .si-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .si-error {
        margin: 0;
        color: #b42318;
        font-size: 0.875rem;
      }
      .si-legal {
        margin: 0.75rem 0 0;
        font-size: 0.75rem;
        line-height: 1.45;
        color: var(--si-muted);
        text-align: center;
      }
    `,
  ],
})
export class StudioSignInPageComponent {
  private readonly auth = inject(StudioAuthService);
  private readonly studio = inject(StudioContextService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  busy = false;
  error = '';

  get emailValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  constructor() {
    if (this.auth.isSignedIn()) {
      void this.enterStudio();
    }
  }

  signInGoogle() {
    this.completeSocial('google', this.email.trim() || 'operator@gmail.com');
  }

  signInApple() {
    this.completeSocial('apple', this.email.trim() || 'operator@icloud.com');
  }

  signInEmail() {
    if (!this.emailValid) {
      this.error = 'Enter a valid work email.';
      return;
    }
    this.completeSocial('email', this.email.trim());
  }

  private completeSocial(provider: 'google' | 'apple' | 'email', email: string) {
    this.busy = true;
    this.error = '';
    setTimeout(() => {
      this.auth.signIn({ email, provider });
      this.busy = false;
      void this.enterStudio();
    }, 650);
  }

  private enterStudio() {
    const next = this.route.snapshot.queryParamMap.get('next');
    const safeNext = next?.startsWith('/studio') ? next : null;
    const target = safeNext ?? (this.studio.hasExperiences() ? '/studio' : '/studio/welcome');
    void this.router.navigateByUrl(target);
  }
}
