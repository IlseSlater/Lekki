import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SETUP_STEPS, type SetupStepSlug } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';
import { StudioWorkspaceComponent } from '../leos/studio-workspace.component';

/**
 * Setup Engine chrome — Variant B vertical journey rail · config · Live phone.
 */
@Component({
  standalone: true,
  selector: 'leos-setup-engine-host',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, StudioWorkspaceComponent],
  template: `
    <leos-studio-workspace [withStory]="true">
      <nav story class="setup-engine__story" aria-label="Setup progress">
        <p class="setup-engine__story-eyebrow">
          Setup
          <span class="setup-engine__story-count">· {{ currentIndex }} of {{ steps.length }}</span>
        </p>
        <ol class="setup-engine__rail">
          @for (s of steps; track s.slug; let i = $index) {
            <li
              class="setup-engine__rail-item"
              [class.is-done]="isDone(s.slug) && s.slug !== currentSlug"
              [class.is-current]="s.slug === currentSlug"
              [class.is-next]="isNext(s.slug)"
            >
              <a
                class="setup-engine__rail-link"
                [routerLink]="'/studio/setup/' + s.slug"
                routerLinkActive="is-current"
                [attr.aria-current]="s.slug === currentSlug ? 'step' : null"
              >
                <span class="setup-engine__rail-node" aria-hidden="true">
                  @if (isDone(s.slug) && s.slug !== currentSlug) {
                    <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                  } @else {
                    {{ i + 1 }}
                  }
                </span>
                <span class="setup-engine__rail-copy">
                  <span class="setup-engine__rail-title">{{ s.title }}</span>
                  @if (s.slug === currentSlug) {
                    <span class="setup-engine__rail-why">{{ s.why }}</span>
                  }
                </span>
              </a>
            </li>
          }
        </ol>
      </nav>
      <router-outlet />
    </leos-studio-workspace>
  `,
  styles: [
    `
      .setup-engine__story {
        display: flex;
        flex-direction: column;
        gap: 0;
        margin: 0;
        padding: 0;
      }
      .setup-engine__story-eyebrow {
        margin: 0 0 1rem;
        padding: 0 0.15rem;
        font-size: 0.6875rem;
        font-weight: 650;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--leos-ink-tertiary, #94a3b8);
      }
      .setup-engine__story-count {
        letter-spacing: 0.04em;
        font-weight: 550;
        text-transform: none;
        color: var(--leos-ink-tertiary, #94a3b8);
      }
      .setup-engine__rail {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .setup-engine__rail-item {
        position: relative;
        min-height: 3rem;
      }
      .setup-engine__rail-item:not(:last-child)::before {
        content: '';
        position: absolute;
        left: 0.68rem;
        top: 1.55rem;
        bottom: -0.1rem;
        width: 1.5px;
        background: var(--leos-border, #eae6e1);
        z-index: 0;
      }
      .setup-engine__rail-item.is-done:not(:last-child)::before {
        background: color-mix(in srgb, var(--studio-success, #4f8a6b) 45%, var(--leos-border, #eae6e1));
      }
      .setup-engine__rail-item.is-current:not(:last-child)::before {
        background: linear-gradient(
          var(--leos-gold, #d7a14a),
          var(--leos-border, #eae6e1)
        );
      }
      .setup-engine__rail-link {
        display: grid;
        grid-template-columns: 1.5rem 1fr;
        column-gap: 0.75rem;
        align-items: start;
        text-decoration: none;
        color: inherit;
        min-height: 2.75rem;
      }
      .setup-engine__rail-node {
        width: 1.35rem;
        height: 1.35rem;
        margin-top: 0.12rem;
        border-radius: 999px;
        display: grid;
        place-items: center;
        border: 1.5px solid var(--leos-border, #eae6e1);
        background: var(--leos-surface, #ffffff);
        z-index: 1;
        position: relative;
        font-size: 0.65rem;
        font-weight: 650;
        color: var(--leos-ink-tertiary, #94a3b8);
        transition:
          background var(--studio-duration-fast, 160ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1)),
          border-color var(--studio-duration-fast, 160ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1)),
          box-shadow var(--studio-duration-fast, 160ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1)),
          color var(--studio-duration-fast, 160ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .setup-engine__rail-item.is-done .setup-engine__rail-node {
        background: var(--studio-success, #4f8a6b);
        border-color: var(--studio-success, #4f8a6b);
        color: #ffffff;
      }
      .setup-engine__rail-item.is-current .setup-engine__rail-node {
        background: var(--leos-gold, #d7a14a);
        border-color: var(--leos-gold, #d7a14a);
        color: var(--leos-on-brand, #1b2230);
        font-weight: 700;
        box-shadow: 0 0 0 4px var(--leos-gold-soft, rgba(215, 161, 74, 0.14));
      }
      .setup-engine__rail-copy {
        padding-bottom: 1rem;
        min-width: 0;
      }
      .setup-engine__rail-title {
        display: block;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1.3;
        color: var(--leos-ink-tertiary, #94a3b8);
        text-wrap: pretty;
        transition: color var(--studio-duration-fast, 160ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .setup-engine__rail-item.is-done .setup-engine__rail-title {
        color: var(--studio-success, #4f8a6b);
        font-weight: 550;
      }
      .setup-engine__rail-item.is-current .setup-engine__rail-title {
        color: var(--leos-ink, #0f172a);
        font-weight: 650;
      }
      .setup-engine__rail-item.is-next .setup-engine__rail-title {
        color: var(--leos-ink-secondary, #64748b);
      }
      .setup-engine__rail-link:hover .setup-engine__rail-title {
        color: var(--leos-ink, #0f172a);
      }
      .setup-engine__rail-why {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow: hidden;
        margin-top: 0.2rem;
        font-size: 0.75rem;
        font-weight: 450;
        line-height: 1.4;
        color: var(--leos-ink-secondary, #64748b);
        text-wrap: pretty;
        animation: setup-rail-why 280ms var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      @keyframes setup-rail-why {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .setup-engine__rail-why {
          animation: none;
        }
      }
    `,
  ],
})
export class SetupEngineHostPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ctx = inject(StudioContextService);

  readonly steps = SETUP_STEPS;
  currentSlug: SetupStepSlug = 'identity';
  currentIndex = 1;

  ngOnInit() {
    this.refresh();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.refresh());
  }

  isDone(slug: SetupStepSlug): boolean {
    return !!this.ctx.activeExperience()?.steps[slug];
  }

  isNext(slug: SetupStepSlug): boolean {
    const idx = this.steps.findIndex((s) => s.slug === slug);
    const cur = this.steps.findIndex((s) => s.slug === this.currentSlug);
    if (idx !== cur + 1) return false;
    return !this.isDone(slug);
  }

  private refresh() {
    const match = /\/studio\/setup\/([^/?#]+)/.exec(this.router.url);
    const slug = (match?.[1] ?? 'identity') as SetupStepSlug;
    this.currentSlug = SETUP_STEPS.some((s) => s.slug === slug) ? slug : 'identity';
    const idx = this.steps.findIndex((s) => s.slug === this.currentSlug);
    this.currentIndex = idx >= 0 ? idx + 1 : 1;
  }
}
