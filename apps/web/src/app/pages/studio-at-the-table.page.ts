import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { StudioContextService } from '../services/studio-context.service';
import { PreviewFocusService } from '../services/preview-focus.service';
import {
  defaultDesignForType,
  type GuestDesignKey,
  type GuestExperienceDesign,
} from '../studio/guest-experience-design';
import { googleReviewUrlFrom, safeReviewUrl } from '../leos/review-links';
import { tipPercentsFrom } from '../leos/pay-choices';
import type { PreviewScreen } from '../preview/preview-protocol';

type TableSwitch = { key: GuestDesignKey; label: string; detail: string };
type TableSection = { id: string; title: string; screen: PreviewScreen; switches: TableSwitch[] };

/**
 * Only switches the guest app really honours live here. Splitting is always
 * available to guests, so it is described, not switched.
 */
export const AT_THE_TABLE_SECTIONS: TableSection[] = [
  {
    id: 'menu',
    title: 'When they sit down',
    screen: 'menu',
    switches: [
      {
        key: 'specials',
        label: 'Open on a Specials page',
        detail: 'Today’s specials and your most-ordered dishes come first.',
      },
    ],
  },
  {
    id: 'meal',
    title: 'During the meal',
    screen: 'help',
    switches: [
      {
        key: 'callStaff',
        label: 'Guests can call their waiter',
        detail: 'Water, cutlery, the card machine or a question. It goes to the waiter for that table.',
      },
    ],
  },
  {
    id: 'pay',
    title: 'Paying',
    screen: 'pay',
    switches: [
      {
        key: 'tipStaff',
        label: 'Guests can add a tip',
        detail: 'Tips go to the waiter on shift.',
      },
    ],
  },
];

@Component({
  standalone: true,
  selector: 'leos-studio-at-the-table-page',
  imports: [FormsModule, RouterLink, ExperienceScreenComponent],
  template: `
    <leos-experience-screen
      purpose="What happens at the table?"
      lead="Choose what guests can do from their phone. The phone beside you shows it as you change it."
      help=""
    >
      <div config class="att">
        @if (savedFlash) {
          <p class="studio-autosave" role="status">Saved automatically</p>
        }

        @for (section of sections; track section.id) {
          <section
            class="att__section"
            [attr.aria-labelledby]="'att-' + section.id"
            (focusin)="show(section.screen)"
            (mouseenter)="show(section.screen)"
          >
            <h2 class="att__title" [id]="'att-' + section.id">{{ section.title }}</h2>
            @for (sw of section.switches; track sw.key) {
              <label class="att__row">
                <span class="att__text">
                  <span class="att__label">{{ sw.label }}</span>
                  <span class="att__detail">{{ sw.detail }}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  class="att__switch"
                  [checked]="design[sw.key]"
                  (change)="toggle(sw.key, $event)"
                />
              </label>
            }
            @if (section.id === 'pay' && design.tipStaff) {
              <div class="leos-field">
                <label class="leos-field__label" for="att-tips">Tip choices (percent)</label>
                <input
                  id="att-tips"
                  class="leos-field__input"
                  inputmode="decimal"
                  placeholder="10, 12.5, 15"
                  [(ngModel)]="tipPercentsText"
                  (ngModelChange)="scheduleSave()"
                />
                <p class="att__detail">
                  Guests see {{ tipPreview }}. Each chip also shows the rand amount on their bill.
                </p>
              </div>
            }
            @if (section.id === 'pay') {
              <p class="att__note">
                Guests can always split: their own items, an equal share, or an amount they choose.
                Paying on the phone needs payments connected in
                <a routerLink="/studio/payments">Payments</a>.
              </p>
            }
          </section>
        }

        <section
          class="att__section"
          aria-labelledby="att-after"
          (focusin)="show('done')"
          (mouseenter)="show('done')"
        >
          <h2 class="att__title" id="att-after">After paying</h2>
          <p class="att__note att__note--top">
            Every guest gets the same choices at equal weight: a Google review, a private note to
            you, and sending your place to a friend. Private notes appear on Home.
          </p>
          <div class="leos-field">
            <label class="leos-field__label" for="att-review">
              Google review link <em class="leos-field__need">optional</em>
            </label>
            <input
              id="att-review"
              class="leos-field__input"
              type="url"
              inputmode="url"
              placeholder="https://g.page/r/…"
              [(ngModel)]="reviewUrl"
              (ngModelChange)="scheduleSave()"
            />
            @if (reviewUrl.trim() && !reviewOk) {
              <p class="att__warn" role="alert">Use the full https:// link from Google.</p>
            }
          </div>
        </section>
      </div>
    </leos-experience-screen>
  `,
  styles: [
    `
      .att {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .att__section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .att__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 650;
        color: var(--studio-ink, #0f172a);
      }
      .att__row {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-height: 3.5rem;
        padding: 0.75rem 1rem;
        border: 1px solid var(--studio-line, #eae6e1);
        border-radius: 1rem;
        cursor: pointer;
      }
      .att__text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .att__label {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--studio-ink, #0f172a);
      }
      .att__detail,
      .att__note {
        font-size: 0.85rem;
        line-height: 1.45;
        color: #475569;
      }
      .att__note {
        margin: 0;
      }
      .att__note a {
        color: var(--studio-ink, #0f172a);
        font-weight: 600;
      }
      .att__switch {
        appearance: none;
        flex-shrink: 0;
        position: relative;
        width: 2.75rem;
        height: 1.625rem;
        margin: 0;
        border-radius: 999px;
        background: #cfc7bb;
        cursor: pointer;
        transition: background var(--studio-duration-fast, 160ms) var(--studio-ease, ease-out);
      }
      .att__switch::after {
        content: '';
        position: absolute;
        top: 0.1875rem;
        left: 0.1875rem;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 999px;
        background: #ffffff;
        transition: transform var(--studio-duration-fast, 160ms) var(--studio-ease, ease-out);
      }
      .att__switch:checked {
        background: #2f7a4f;
      }
      .att__switch:checked::after {
        transform: translateX(1.125rem);
      }
      .att__switch:focus-visible {
        outline: 2px solid var(--studio-accent, #d7a14a);
        outline-offset: 2px;
      }
      .att__warn {
        margin: 0.35rem 0 0;
        font-size: 0.85rem;
        color: #9a3412;
      }
    `,
  ],
})
export class StudioAtTheTablePageComponent implements OnInit, OnDestroy {
  private readonly ctx = inject(StudioContextService);
  private readonly focus = inject(PreviewFocusService);

  readonly sections = AT_THE_TABLE_SECTIONS;
  design: GuestExperienceDesign = defaultDesignForType('restaurant');
  reviewUrl = '';
  savedFlash = false;
  private saveTimer?: ReturnType<typeof setTimeout>;
  private flashTimer?: ReturnType<typeof setTimeout>;
  private lastShown: PreviewScreen | null = null;

  tipPercentsText = '';

  /** "No tip, 10%, 12.5%, 15%" — what the chips will read. */
  get tipPreview(): string {
    return ['No tip', ...tipPercentsFrom({ tipPercents: this.tipPercentsText }).map((p) => `${p}%`)].join(', ');
  }

  get reviewOk(): boolean {
    return !!safeReviewUrl(this.reviewUrl);
  }

  ngOnInit() {
    this.ctx.ensureWorkspaceHydrated();
    const active = this.ctx.activeExperience();
    const typeId = active?.typeId ?? 'restaurant';
    this.design = { ...defaultDesignForType(typeId), ...(active?.guestDesign ?? {}) };
    this.reviewUrl = googleReviewUrlFrom(active?.guestDesign as unknown as Record<string, unknown>);
    this.tipPercentsText = tipPercentsFrom(
      active?.guestDesign as unknown as Record<string, unknown>,
    ).join(', ');
  }

  ngOnDestroy() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.persist();
    }
    if (this.flashTimer) clearTimeout(this.flashTimer);
  }

  show(screen: PreviewScreen) {
    if (screen === this.lastShown) return;
    this.lastShown = screen;
    this.focus.show(screen);
  }

  toggle(key: GuestDesignKey, ev: Event) {
    this.design = { ...this.design, [key]: (ev.target as HTMLInputElement).checked };
    this.persist();
  }

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = undefined;
      this.persist();
    }, 400);
  }

  private persist() {
    const current = this.ctx.activeExperience();
    // A half-typed link keeps the last good one; the switches still save.
    const typed = this.reviewUrl.trim();
    const url = typed
      ? safeReviewUrl(typed) ||
        googleReviewUrlFrom(current?.guestDesign as unknown as Record<string, unknown>)
      : '';
    this.ctx.upsertActive({
      guestDesign: {
        ...(current?.guestDesign ?? {}),
        ...this.design,
        googleReviewUrl: url,
        tipPercents: tipPercentsFrom({ tipPercents: this.tipPercentsText }),
      } as unknown as GuestExperienceDesign,
    });
    this.savedFlash = true;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => (this.savedFlash = false), 1800);
  }
}
