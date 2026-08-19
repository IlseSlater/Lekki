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

type PayOption = { key: GuestDesignKey | 'card' | 'applePay' | 'googlePay'; label: string };

/**
 * Setup — How guests pay.
 * Design System v1: one question, Live Experience updates, calm Continue.
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
      </div>

      <leos-confidence-indicator
        confidence
        eyebrow="Guests will pay"
        [fact]="confidenceFact"
        [detail]="venueName"
        [ready]="canContinue"
        okLabel="Looks good"
        waiting="Turn on at least one way guests can pay"
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
        transition: transform var(--studio-duration-fast, 160ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .pay-toggle input:checked {
        transform: scale(1.05);
      }
    `,
  ],
})
export class SetupPaymentsPageComponent implements OnInit, OnDestroy {
  private readonly ctx = inject(StudioContextService);
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

  readonly options: PayOption[] = [
    { key: 'card', label: 'Card' },
    { key: 'applePay', label: 'Apple Pay' },
    { key: 'googlePay', label: 'Google Pay' },
    { key: 'tipStaff', label: 'Tips' },
    { key: 'splitBill', label: 'Split bill' },
  ];

  get canContinue() {
    return this.card || this.applePay || this.googlePay;
  }

  get confidenceFact() {
    const labels: string[] = [];
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
    this.persistPayMethods(false);
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
    if (markDone) this.ctx.markStep('payments');
    this.savedFlash = true;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.savedFlash = false;
    }, 1800);
  }
}
