import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SETUP_STEPS, type SetupStepSlug } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';
import { LiveExperiencePanelComponent } from '../leos/live-experience-panel.component';

/**
 * Setup Engine chrome — Design System v1.
 * Progress story + Studio column (640) + phone-on-desk Live Experience (420).
 */
@Component({
  standalone: true,
  selector: 'leos-setup-engine-host',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LiveExperiencePanelComponent],
  template: `
    <div class="setup-engine">
      <div class="setup-engine__body">
        <div class="setup-engine__studio">
          <nav class="setup-engine__story" aria-label="Setup progress">
            @for (s of steps; track s.slug) {
              <a
                class="setup-engine__story-link"
                [routerLink]="'/studio/setup/' + s.slug"
                routerLinkActive="is-current"
                [class.is-done]="isDone(s.slug) && s.slug !== currentSlug"
              >
                {{ s.title }}
              </a>
            }
          </nav>
          <router-outlet />
        </div>
        <div class="setup-engine__live">
          <leos-live-experience-panel />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .setup-engine {
        width: 100%;
        max-width: calc(var(--studio-studio-width, 640px) + var(--studio-live-width, 420px) + 6rem);
        margin: 0 auto;
        padding: var(--studio-pad-outer, 48px) var(--studio-pad-outer, 48px) 3rem;
        box-sizing: border-box;
      }
      .setup-engine__body {
        display: grid;
        gap: 3rem;
        align-items: start;
      }
      @media (min-width: 1024px) {
        .setup-engine__body {
          grid-template-columns: minmax(0, var(--studio-studio-width, 640px)) var(--studio-live-width, 420px);
          justify-content: space-between;
        }
      }
      .setup-engine__studio {
        min-width: 0;
        max-width: var(--studio-studio-width, 640px);
      }
      .setup-engine__live {
        min-width: 0;
        display: flex;
        justify-content: center;
        padding-top: 0.5rem;
      }
      @media (max-width: 1023px) {
        .setup-engine__live {
          order: -1;
        }
        .setup-engine {
          padding: 1.5rem 1.25rem 2.5rem;
        }
      }
      .setup-engine__story {
        display: flex;
        flex-direction: column;
        gap: 0;
        margin: 0 0 var(--studio-pad-section, 40px);
        padding: 0;
      }
      .setup-engine__story-link {
        display: block;
        padding: 0.65rem 0;
        border-bottom: 1px solid var(--studio-line, #e7e2db);
        text-decoration: none;
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--studio-ink-tertiary, #8f96a3);
        transition:
          color var(--studio-duration, 220ms) var(--studio-ease, ease),
          opacity var(--studio-duration, 220ms) var(--studio-ease, ease);
      }
      .setup-engine__story-link:hover {
        color: var(--studio-ink, #1b2230);
      }
      .setup-engine__story-link.is-done {
        color: var(--studio-success, #4f8a6b);
      }
      .setup-engine__story-link.is-current {
        color: var(--studio-ink, #1b2230);
        font-weight: 650;
      }
    `,
  ],
})
export class SetupEngineHostPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ctx = inject(StudioContextService);

  readonly steps = SETUP_STEPS;
  currentSlug: SetupStepSlug = 'identity';

  ngOnInit() {
    this.refresh();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.refresh());
  }

  isDone(slug: SetupStepSlug): boolean {
    return !!this.ctx.activeExperience()?.steps[slug];
  }

  private refresh() {
    const match = /\/studio\/setup\/([^/?#]+)/.exec(this.router.url);
    const slug = (match?.[1] ?? 'identity') as SetupStepSlug;
    this.currentSlug = SETUP_STEPS.some((s) => s.slug === slug) ? slug : 'identity';
  }
}
