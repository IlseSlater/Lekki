import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OnboardingService,
  type GuestGender,
} from '../services/onboarding.service';
import { LeosApiService, SessionStateService } from '../services/leos-api.service';

type Step = 'account' | 'verify' | 'name' | 'birthday' | 'gender' | 'phone' | 'welcome';

type GenderOption = { id: GuestGender; label: string };

function daysInMonth(year: number, monthIndex: number): number {
  // monthIndex: 0-11
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Guest LEKKI onboarding (after brand splash):
 * Account → Verify → Name → Birthday → Gender → Phone → Welcome → Experience
 *
 * Birthday + Gender follow one-question-per-page (reference: calm profile steps).
 * Visual language: Lekki cream · gold Continue — not third-party brand colours.
 */
@Component({
  standalone: true,
  imports: [FormsModule],
  selector: 'leos-onboarding-page',
  template: `
    <div class="ob" [attr.data-step]="step">
      @if (step === 'account') {
        <section class="ob-account">
          <button type="button" class="ob-account__close" aria-label="Back" (click)="goScan()">
            ×
          </button>

          <div class="ob-account__brand">
            <img
              class="ob-account__logo"
              src="/brand/lekki-mark.svg"
              width="80"
              height="80"
              alt=""
            />
            <p class="ob-account__wordmark">Lekki</p>
            <p class="ob-account__tagline">The human experience app.</p>
            <span class="ob-account__goldline" aria-hidden="true"></span>
          </div>

          <header class="ob-account__header">
            <h1 class="ob-account__title">Create an account</h1>
            <p class="ob-account__lead">Use email or continue with social.</p>
          </header>

          <div class="ob-account__middle">
            <div class="ob-account__socials">
              <button type="button" class="ob-social" (click)="continueWithGoogle()">
                <svg class="ob-social__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
              <button type="button" class="ob-social" (click)="continueWithApple()">
                <svg class="ob-social__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#1B2230"
                    d="M16.7 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.2-.8-2.2-3.5zM14.4 6.3c.6-.7 1-1.7.9-2.7-0.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 1.9-.5 2.5-1.2z"
                  />
                </svg>
                Continue with Apple
              </button>
              <button type="button" class="ob-social" (click)="continueWithFacebook()">
                <svg class="ob-social__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#1877F2"
                    d="M24 12.07C24 5.41 18.63.07 12 .07S0 5.41 0 12.07c0 5.99 4.39 10.95 10.12 11.85v-8.39H7.08v-3.46h3.04V9.41c0-3 1.79-4.66 4.52-4.66 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.93-1.95 1.87v2.25h3.32l-.53 3.46h-2.79v8.39C19.61 23.02 24 18.06 24 12.07z"
                  />
                </svg>
                Continue with Facebook
              </button>
            </div>
          </div>

          <div class="ob-account__footer">
            <p class="ob-or"><span>or</span></p>

            <label class="ob-field">
              <span class="ob-field__label">Email</span>
              <input
                class="ob-field__input"
                type="email"
                name="email"
                autocomplete="email"
                [(ngModel)]="email"
                placeholder="you@email.com"
                (keydown.enter)="sendCode()"
              />
            </label>

            @if (error && step === 'account') {
              <p class="ob-error" role="alert">{{ error }}</p>
            }

            <button
              type="button"
              class="ob-btn ob-btn--brand"
              [disabled]="!emailValid || busy"
              (click)="sendCode()"
            >
              @if (busy) {
                <span class="ob-spinner" aria-hidden="true"></span>
              } @else {
                Continue with email
              }
            </button>

            <p class="ob-legal">
              By continuing, you agree to our
              <a href="#" class="ob-legal__link">Terms</a>
              and
              <a href="#" class="ob-legal__link">Privacy Policy</a>.
            </p>
          </div>
        </section>
      }

      @if (step === 'verify') {
        <section class="ob-verify">
          <header class="ob-verify__header">
            <button type="button" class="ob-verify__back" aria-label="Back" (click)="go('account')">
              ‹
            </button>
            <h1 class="ob-verify__title">Enter code</h1>
            <p class="ob-verify__lead">We have sent you a 6-digit code</p>
          </header>

          <div class="ob-otp" role="group" aria-label="Verification code">
            @for (d of otpDigits; track $index; let i = $index) {
              <input
                class="ob-otp__cell"
                type="text"
                inputmode="numeric"
                maxlength="1"
                [attr.aria-label]="'Digit ' + (i + 1)"
                [(ngModel)]="otpDigits[i]"
                (ngModelChange)="onOtpChange(i)"
                (keydown)="onOtpKey($event, i)"
                (paste)="onOtpPaste($event)"
              />
            }
          </div>

          @if (resendIn > 0) {
            <p class="ob-verify__resend">Resend after {{ resendIn }} seconds</p>
          } @else {
            <button type="button" class="ob-verify__resend-btn" (click)="resendCode()">
              Resend code
            </button>
          }

          @if (error) {
            <p class="ob-error" role="alert">{{ error }}</p>
          }
        </section>
      }

      @if (step === 'name') {
        <section class="ob-question">
          <button type="button" class="ob-nav-circle" aria-label="Back" (click)="go('verify')">
            ←
          </button>
          <div class="ob-question__body">
            <h1 class="ob-question__title">What’s your name?</h1>
            <input
              class="ob-question__input"
              type="text"
              name="name"
              autocomplete="nickname"
              [(ngModel)]="name"
              placeholder="Your name"
              autofocus
              (keydown.enter)="saveName()"
            />
          </div>
          <button
            type="button"
            class="ob-btn ob-btn--brand ob-question__cta"
            [disabled]="!name.trim()"
            (click)="saveName()"
          >
            Continue
          </button>
        </section>
      }

      @if (step === 'birthday') {
        <section class="ob-question ob-question--top">
          <button type="button" class="ob-nav-circle" aria-label="Back" (click)="go('name')">
            ←
          </button>
          <div class="ob-question__body ob-question__body--start">
            <h1 class="ob-question__title">
              When’s your birthday?
            </h1>
            <p class="ob-question__lead">So we can greet you on your day</p>

            <div class="ob-field ob-field--block">
              <div class="ob-bday-inline-picker" aria-label="Choose birthday">
                <div class="ob-bday-picker" role="group" aria-label="Choose month, day and year">
                  <div class="ob-bday-col" aria-label="Month">
                    <div class="ob-bday-col__frame">
                      <div class="ob-bday-wheel__shade" aria-hidden="true"></div>
                      <div
                        #bdayMonthWheel
                        class="ob-bday-wheel"
                        role="listbox"
                        [attr.aria-activedescendant]="'bday-month-' + birthdayDraftMonthIndex"
                        (scroll)="onBirthdayMonthWheelScroll()"
                      >
                        @for (m of birthdayMonths; track m.index) {
                          <div
                            class="ob-bday-wheel__item"
                            [id]="'bday-month-' + m.index"
                            [class.ob-bday-wheel__item--on]="birthdayDraftMonthIndex === m.index"
                          >
                            {{ m.label }}
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="ob-bday-col" aria-label="Day">
                    <div class="ob-bday-col__frame">
                      <div class="ob-bday-wheel__shade" aria-hidden="true"></div>
                      <div
                        #bdayDayWheel
                        class="ob-bday-wheel"
                        role="listbox"
                        (scroll)="onBirthdayDayWheelScroll()"
                      >
                        @for (d of birthdayDays; track d) {
                          <div
                            class="ob-bday-wheel__item"
                            [class.ob-bday-wheel__item--on]="birthdayDraftDay === d"
                          >
                            {{ d }}
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="ob-bday-col" aria-label="Year">
                    <div class="ob-bday-col__frame">
                      <div class="ob-bday-wheel__shade" aria-hidden="true"></div>
                      <div
                        #bdayYearWheel
                        class="ob-bday-wheel"
                        role="listbox"
                        (scroll)="onBirthdayYearWheelScroll()"
                      >
                        @for (y of birthdayYears; track y) {
                          <div
                            class="ob-bday-wheel__item"
                            [class.ob-bday-wheel__item--on]="birthdayDraftYear === y"
                          >
                            {{ y }}
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p class="ob-footnote">Your birthday won’t appear to other guests.</p>
          </div>
          <button
            type="button"
            class="ob-btn ob-btn--brand ob-question__cta"
            [disabled]="!birthdayDraft"
            (click)="saveBirthday()"
          >
            Continue
          </button>
        </section>
      }

      @if (step === 'gender') {
        <section class="ob-question ob-question--top">
          <button type="button" class="ob-nav-circle" aria-label="Back" (click)="go('birthday')">
            ←
          </button>
          <div class="ob-question__body ob-question__body--start">
            <h1 class="ob-question__title">What’s your gender?</h1>
            <p class="ob-question__lead">Optional context so we can welcome you thoughtfully.</p>

            <ul class="ob-choices" role="listbox" [attr.aria-activedescendant]="gender || null">
              @for (opt of genderOptions; track opt.id) {
                <li>
                  <button
                    type="button"
                    role="option"
                    class="ob-choice"
                    [id]="opt.id"
                    [class.ob-choice--on]="gender === opt.id"
                    [attr.aria-selected]="gender === opt.id"
                    (click)="gender = opt.id"
                  >
                    {{ opt.label }}
                  </button>
                </li>
              }
            </ul>
            <p class="ob-footnote">Your gender won’t appear to other guests.</p>
          </div>
          <button
            type="button"
            class="ob-btn ob-btn--brand ob-question__cta"
            [disabled]="!gender"
            (click)="saveGender()"
          >
            Continue
          </button>
        </section>
      }

      @if (step === 'phone') {
        <section class="ob-question">
          <button type="button" class="ob-nav-circle" aria-label="Back" (click)="go('gender')">
            ←
          </button>
          <div class="ob-question__body">
            <h1 class="ob-question__title">What’s your phone number?</h1>
            <input
              class="ob-question__input"
              type="tel"
              name="phone"
              autocomplete="tel"
              [(ngModel)]="phone"
              placeholder="+27 82 000 0000"
              autofocus
              (keydown.enter)="savePhone()"
            />
            <p class="ob-muted">Optional — helps the team recognise you.</p>
          </div>
          <button type="button" class="ob-btn ob-btn--brand ob-question__cta" (click)="savePhone()">
            Continue
          </button>
        </section>
      }

      @if (step === 'welcome') {
        <section class="ob-done">
          <div class="ob-done__brand">
            <p class="ob-done__hello">Welcome{{ name ? ', ' + firstName : '' }}.</p>
            <h1 class="ob-done__title">You’re in.</h1>
            <p class="ob-done__lead">
              @if (entryToken) {
                Your place is ready — open the experience when you are.
              } @else {
                Scan a QR at your place first, then come back here.
              }
            </p>
          </div>
          @if (error) {
            <p class="ob-error" role="alert">{{ error }}</p>
          }
          <div class="ob-done__actions">
            @if (entryToken) {
              <button
                type="button"
                class="ob-btn ob-btn--brand"
                [disabled]="busy"
                (click)="enterExperience()"
              >
                @if (busy) {
                  Opening experience…
                } @else {
                  Continue to experience
                }
              </button>
            } @else {
              <button type="button" class="ob-btn ob-btn--brand" (click)="goScan()">
                Scan QR code
              </button>
            }
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPageComponent implements OnInit {
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(LeosApiService);
  private readonly state = inject(SessionStateService);

  step: Step = 'account';
  email = '';
  name = '';
  phone = '';
  birthday = '';
  birthdayDraft = '';
  birthdayPickerOpen = false;
  gender: GuestGender = '';
  entryToken = '';
  otpDigits = ['', '', '', '', '', ''];
  busy = false;
  error = '';
  resendIn = 0;
  private resendTimer?: ReturnType<typeof setInterval>;

  private static readonly WHEEL_ITEM_H = 44; // must match SCSS

  @ViewChild('bdayMonthWheel', { read: ElementRef })
  private monthWheel?: ElementRef<HTMLElement>;
  @ViewChild('bdayDayWheel', { read: ElementRef })
  private dayWheel?: ElementRef<HTMLElement>;
  @ViewChild('bdayYearWheel', { read: ElementRef })
  private yearWheel?: ElementRef<HTMLElement>;

  readonly genderOptions: GenderOption[] = [
    { id: 'man', label: 'Man' },
    { id: 'woman', label: 'Woman' },
    { id: 'nonbinary', label: 'Non-binary' },
    { id: 'prefer_not', label: 'Prefer not to say' },
  ];

  get emailValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  get otpComplete() {
    return this.otpDigits.every((d) => /^\d$/.test(d));
  }

  get firstName() {
    return this.name.trim().split(/\s+/)[0] ?? '';
  }

  get maxBirthday() {
    return new Date().toISOString().slice(0, 10);
  }

  private parseBirthdayIso(iso: string): { year: number; monthIndex: number; day: number } | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? '').trim());
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]); // 1-12
    const day = Number(m[3]);
    if (!year || month < 1 || month > 12 || !day) return null;
    return { year, monthIndex: month - 1, day };
  }

  birthdayDraftYear = 1995;
  birthdayDraftMonthIndex = 1; // Feb
  birthdayDraftDay = 18;

  private birthdayMaxParts(): { year: number; monthIndex: number; day: number } | null {
    const raw = this.maxBirthday;
    return this.parseBirthdayIso(raw);
  }

  private clampDay(year: number, monthIndex: number, day: number): number {
    const max = daysInMonth(year, monthIndex);
    return Math.min(day, max);
  }

  private updateBirthdayDraftFromParts() {
    const day = this.clampDay(this.birthdayDraftYear, this.birthdayDraftMonthIndex, this.birthdayDraftDay);
    // Keep ISO in the canonical shape YYYY-MM-DD (what backend expects).
    const y = String(this.birthdayDraftYear).padStart(4, '0');
    const m = String(this.birthdayDraftMonthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    this.birthdayDraft = `${y}-${m}-${d}`;
    this.birthdayDraftDay = day;
  }

  private updatePartsFromDraftIfValid() {
    const parsed = this.parseBirthdayIso(this.birthdayDraft);
    if (!parsed) return;
    this.birthdayDraftYear = parsed.year;
    this.birthdayDraftMonthIndex = parsed.monthIndex;
    this.birthdayDraftDay = parsed.day;
    this.updateBirthdayDraftFromParts();
  }

  get birthdayDisplay() {
    if (!this.birthday) return '';
    const [y, m, d] = this.birthday.split('-');
    if (!y || !m || !d) return this.birthday;
    return `${d}/${m}/${y}`;
  }

  get birthdayMonths(): Array<{ index: number; label: string }> {
    const maxParts = this.birthdayMaxParts();
    const maxYear = maxParts?.year ?? Number(this.maxBirthday.slice(0, 4));
    const maxMonthIndex = maxParts?.monthIndex ?? Number(this.maxBirthday.slice(5, 7)) - 1;

    const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return labels
      .map((label, index) => ({ index, label }))
      .filter(({ index }) => {
        if (!maxParts) return true;
        if (this.birthdayDraftYear < maxYear) return true;
        if (this.birthdayDraftYear > maxYear) return false;
        return index <= maxMonthIndex;
      });
  }

  get birthdayDays(): number[] {
    const maxParts = this.birthdayMaxParts();
    const days = daysInMonth(this.birthdayDraftYear, this.birthdayDraftMonthIndex);
    const lastDay =
      maxParts &&
      this.birthdayDraftYear === maxParts.year &&
      this.birthdayDraftMonthIndex === maxParts.monthIndex
        ? Math.min(days, maxParts.day)
        : days;
    return Array.from({ length: Math.max(0, lastDay) }, (_, i) => i + 1);
  }

  get birthdayYears(): number[] {
    const maxParts = this.birthdayMaxParts();
    const maxYear = maxParts?.year ?? Number(this.maxBirthday.slice(0, 4));
    const startYear = maxYear - 100;
    return Array.from({ length: maxYear - startYear + 1 }, (_, i) => startYear + i);
  }

  ngOnInit() {
    const profile = this.onboarding.read();
    const qToken = this.route.snapshot.queryParamMap.get('token')?.trim();
    if (qToken) {
      this.onboarding.save({ entryToken: qToken });
      profile.entryToken = qToken;
    }

    this.email = profile.email;
    this.name = profile.name;
    this.phone = profile.phone;
    this.birthday = profile.birthday;
    this.gender = profile.gender;
    this.entryToken = profile.entryToken;

    if (!this.entryToken) {
      void this.router.navigate(['/scan']);
      return;
    }

    const stepParam = this.route.snapshot.queryParamMap.get('step');
    if (stepParam === 'welcome') {
      this.step = 'welcome';
      return;
    }

    if (profile.completed && this.onboarding.hasPersonalDetails()) {
      this.step = 'welcome';
      return;
    }
    if (profile.verified && profile.name.trim() && profile.birthday && profile.gender) {
      this.step = profile.phone ? 'welcome' : 'phone';
      return;
    }
    if (profile.verified && profile.name.trim() && profile.birthday) {
      this.step = 'gender';
      return;
    }
    if (profile.verified && profile.name.trim()) {
      this.step = 'birthday';
      this.initBirthdayDraftForPicker();
      return;
    }
    if (profile.verified) {
      this.step = 'name';
      return;
    }
    if (profile.email) {
      this.step = 'verify';
      return;
    }
    this.step = 'account';
  }

  go(step: Step) {
    this.error = '';
    this.birthdayPickerOpen = false;
    this.step = step;
    if (step === 'birthday') this.initBirthdayDraftForPicker();
  }

  goScan() {
    void this.router.navigate(['/scan']);
  }

  continueWithGoogle() {
    this.email = this.email.trim() || 'you@gmail.com';
    this.sendCode();
  }

  continueWithApple() {
    this.email = this.email.trim() || 'you@icloud.com';
    this.sendCode();
  }

  continueWithFacebook() {
    this.email = this.email.trim() || 'you@facebook.com';
    this.sendCode();
  }

  sendCode() {
    if (!this.emailValid) {
      this.error = 'Enter a valid email to continue.';
      return;
    }
    this.busy = true;
    this.error = '';
    this.onboarding.save({
      email: this.email.trim(),
      entryToken: this.entryToken,
      verified: false,
    });
    setTimeout(() => {
      this.busy = false;
      this.otpDigits = ['', '', '', '', '', ''];
      this.startResend(28);
      this.go('verify');
    }, 700);
  }

  resendCode() {
    if (this.resendIn > 0) return;
    this.startResend(28);
  }

  verifyCode() {
    if (!this.otpComplete) return;
    this.onboarding.save({ email: this.email.trim(), verified: true });
    this.go('name');
  }

  saveName() {
    const value = this.name.trim();
    if (!value) return;
    this.onboarding.save({ name: value });
    this.go('birthday');
  }

  openBirthdayPicker() {
    this.birthdayDraft = this.birthday || '1995-02-18';
    this.updatePartsFromDraftIfValid();
    this.birthdayPickerOpen = true;
    // Wheels only exist when the sheet is open.
    setTimeout(() => this.syncBirthdayWheels(), 0);
  }

  /**
   * Birthday step now inlines the picker, so we must initialize the wheel
   * values when entering the step (no extra click needed).
   */
  private initBirthdayDraftForPicker() {
    this.birthdayDraft = this.birthday || '1995-02-18';
    this.updatePartsFromDraftIfValid();
    setTimeout(() => this.syncBirthdayWheels(), 0);
  }

  closeBirthdayPicker() {
    this.birthdayPickerOpen = false;
  }

  onBirthdayDraft(value: string) {
    // Legacy hook for the old native <input type="date">.
    // Kept so templates or future refactors won't break compilation.
    this.birthdayDraft = value;
    this.updatePartsFromDraftIfValid();
  }

  selectBirthdayMonth(index: number) {
    this.birthdayDraftMonthIndex = index;
    // Clamp day (e.g. moving from March 31 → April).
    this.birthdayDraftDay = this.clampDay(this.birthdayDraftYear, this.birthdayDraftMonthIndex, this.birthdayDraftDay);
    this.updateBirthdayDraftFromParts();
    if (this.birthdayPickerOpen) setTimeout(() => this.syncBirthdayWheels(), 0);
  }

  selectBirthdayDay(day: number) {
    this.birthdayDraftDay = day;
    this.updateBirthdayDraftFromParts();
    if (this.birthdayPickerOpen) setTimeout(() => this.syncBirthdayWheels(), 0);
  }

  selectBirthdayYear(year: number) {
    this.birthdayDraftYear = year;
    this.birthdayDraftDay = this.clampDay(this.birthdayDraftYear, this.birthdayDraftMonthIndex, this.birthdayDraftDay);
    this.updateBirthdayDraftFromParts();
    if (this.birthdayPickerOpen) setTimeout(() => this.syncBirthdayWheels(), 0);
  }

  private syncWheelScroll(wheel: HTMLElement, index: number) {
    wheel.scrollTop = index * OnboardingPageComponent.WHEEL_ITEM_H;
  }

  private syncBirthdayWheels() {
    if (!this.birthdayPickerOpen) return;

    if (this.monthWheel?.nativeElement) {
      const el = this.monthWheel.nativeElement;
      const months = this.birthdayMonths;
      const idx = months.findIndex((m) => m.index === this.birthdayDraftMonthIndex);
      if (idx >= 0) this.syncWheelScroll(el, idx);
    }

    if (this.dayWheel?.nativeElement) {
      const el = this.dayWheel.nativeElement;
      const days = this.birthdayDays;
      const idx = days.findIndex((d) => d === this.birthdayDraftDay);
      if (idx >= 0) this.syncWheelScroll(el, idx);
    }

    if (this.yearWheel?.nativeElement) {
      const el = this.yearWheel.nativeElement;
      const years = this.birthdayYears;
      const idx = years.findIndex((y) => y === this.birthdayDraftYear);
      if (idx >= 0) this.syncWheelScroll(el, idx);
    }
  }

  private wheelIndexFromScroll(el: HTMLElement): number {
    const raw = el.scrollTop / OnboardingPageComponent.WHEEL_ITEM_H;
    return Math.round(raw);
  }

  onBirthdayMonthWheelScroll() {
    const el = this.monthWheel?.nativeElement;
    if (!el) return;
    const idx = this.wheelIndexFromScroll(el);
    const months = this.birthdayMonths;
    const safe = Math.max(0, Math.min(idx, months.length - 1));
    const selected = months[safe];
    if (!selected) return;
    if (selected.index !== this.birthdayDraftMonthIndex) this.selectBirthdayMonth(selected.index);
  }

  onBirthdayDayWheelScroll() {
    const el = this.dayWheel?.nativeElement;
    if (!el) return;
    const idx = this.wheelIndexFromScroll(el);
    const days = this.birthdayDays;
    const safe = Math.max(0, Math.min(idx, days.length - 1));
    const selected = days[safe];
    if (!selected) return;
    if (selected !== this.birthdayDraftDay) this.selectBirthdayDay(selected);
  }

  onBirthdayYearWheelScroll() {
    const el = this.yearWheel?.nativeElement;
    if (!el) return;
    const idx = this.wheelIndexFromScroll(el);
    const years = this.birthdayYears;
    const safe = Math.max(0, Math.min(idx, years.length - 1));
    const selected = years[safe];
    if (!selected) return;
    if (selected !== this.birthdayDraftYear) this.selectBirthdayYear(selected);
  }

  confirmBirthday() {
    if (!this.birthdayDraft) return;
    this.updateBirthdayDraftFromParts();
    this.birthday = this.birthdayDraft;
    this.birthdayPickerOpen = false;
  }

  saveBirthday() {
    if (!this.birthdayDraft) return;
    this.updateBirthdayDraftFromParts();
    this.birthday = this.birthdayDraft;
    this.onboarding.save({ birthday: this.birthday });
    this.go('gender');
  }

  saveGender() {
    if (!this.gender) return;
    this.onboarding.save({ gender: this.gender });
    this.go('phone');
  }

  savePhone() {
    this.onboarding.save({ phone: this.phone.trim() });
    this.go('welcome');
  }

  enterExperience() {
    const token = this.entryToken.trim() || this.onboarding.read().entryToken;
    const displayName = this.name.trim() || this.onboarding.read().name || 'Guest';
    if (!token) {
      this.error = 'Scan a QR first so we know which place to open.';
      return;
    }
    this.busy = true;
    this.error = '';
    this.api.resolveEntry(this.state.entryBody(token, displayName)).subscribe({
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
        this.state.token = token;
        this.state.displayName = displayName;
        this.state.persist();
        this.api.connectSocket(this.state.organisationId, this.state.sessionId);
        this.onboarding.save({
          completed: true,
          entryToken: token,
          name: displayName,
          birthday: this.birthday || this.birthdayDraft,
          gender: this.gender,
        });
        this.busy = false;
        void this.router.navigate(['/experience']);
      },
      error: (err) => {
        this.busy = false;
        const status = err?.status as number | undefined;
        if (!status) {
          this.error =
            'Can’t reach the Lekki service. Keep this phone on the same Wi‑Fi as the venue laptop, then try again.';
          return;
        }
        this.error =
          err?.error?.message ?? err?.message ?? 'Could not open the experience — try again.';
      },
    });
  }

  onOtpChange(index: number) {
    const v = (this.otpDigits[index] ?? '').replace(/\D/g, '').slice(-1);
    this.otpDigits[index] = v;
    if (v && index < 5) {
      const next = document.querySelectorAll<HTMLInputElement>('.ob-otp__cell')[index + 1];
      next?.focus();
    }
    if (this.otpComplete) this.verifyCode();
  }

  onOtpKey(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prev = document.querySelectorAll<HTMLInputElement>('.ob-otp__cell')[index - 1];
      prev?.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) ?? '';
    for (let i = 0; i < 6; i++) this.otpDigits[i] = text[i] ?? '';
    if (this.otpComplete) this.verifyCode();
  }

  private startResend(seconds: number) {
    this.resendIn = seconds;
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendIn -= 1;
      if (this.resendIn <= 0 && this.resendTimer) clearInterval(this.resendTimer);
    }, 1000);
  }
}
