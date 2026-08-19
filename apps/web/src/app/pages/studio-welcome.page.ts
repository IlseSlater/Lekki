import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { StudioAuthService } from '../services/studio-auth.service';
import { StudioContextService } from '../services/studio-context.service';
import { experienceLabel } from '../studio/experience-registry';

/**
 * Studio Welcome — first-time create OR Welcome Back (Never Ask a Human to Remember).
 */
@Component({
  standalone: true,
  imports: [ExperienceScreenComponent, RouterLink],
  template: `
    <div class="studio-motion-appear">
      @if (returning) {
        <article class="welcome-back">
          <header class="welcome-back__hero">
            <p class="welcome-back__greeting">{{ greeting }}</p>
            <h1 class="welcome-back__venue">{{ venue }}</h1>
            <p class="welcome-back__ready" [class.welcome-back__ready--ok]="live">{{ readiness }}</p>
          </header>

          @if (remembered.length) {
            <ul class="welcome-back__list" aria-label="What LEOS remembers">
              @for (line of remembered; track line) {
                <li>{{ line }}</li>
              }
            </ul>
          }

          <footer class="welcome-back__footer">
            <a class="leos-btn leos-btn--secondary" routerLink="/studio/create">Create another</a>
            <a class="leos-btn leos-btn--primary" [routerLink]="primaryLink">{{ primaryCta }}</a>
          </footer>
        </article>
      } @else {
        <leos-experience-screen
          purpose="Let’s get your experience ready."
          lead="A few calm steps — then guests can scan a QR and join."
          help=""
          [showFooter]="true"
        >
          <ol class="leos-studio-steps" config>
            <li>Choose what you’re creating</li>
            <li>Who you are</li>
            <li>What guests experience</li>
            <li>Where guests join</li>
            <li>How guests pay</li>
            <li>Go Live</li>
          </ol>
          <p class="leos-muted">Most teams finish in under ten minutes.</p>
          <a escape class="leos-btn leos-btn--secondary" routerLink="/studio">Home</a>
          <a primary class="leos-btn leos-btn--primary" routerLink="/studio/create">Continue</a>
        </leos-experience-screen>
      }
    </div>
  `,
  styles: [
    `
      .welcome-back {
        max-width: 32rem;
      }
      .welcome-back__hero {
        margin-bottom: 1.5rem;
      }
      .welcome-back__greeting {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .welcome-back__venue {
        margin: 0.35rem 0 0;
        font-family: 'Fraunces', Georgia, serif;
        font-size: clamp(1.75rem, 4vw, 2.15rem);
        font-weight: 650;
        letter-spacing: -0.03em;
        color: var(--studio-ink, #1b2230);
      }
      .welcome-back__ready {
        margin: 0.85rem 0 0;
        font-size: 1.125rem;
        font-weight: 500;
        color: var(--studio-ink-secondary, #6b7280);
        line-height: 1.4;
      }
      .welcome-back__ready--ok {
        color: var(--studio-success, #4f8a6b);
        font-weight: 600;
      }
      .welcome-back__list {
        margin: 0 0 1.75rem;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }
      .welcome-back__list li {
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--studio-line, #e7e2db);
        font-size: 0.9375rem;
        color: var(--studio-ink, #1b2230);
      }
      .welcome-back__list li:last-child {
        border-bottom: none;
      }
      .welcome-back__footer {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
    `,
  ],
})
export class StudioWelcomePageComponent implements OnInit {
  private readonly ctx = inject(StudioContextService);
  private readonly auth = inject(StudioAuthService);

  returning = false;
  live = false;
  greeting = 'Welcome back.';
  venue = '';
  readiness = 'Everything is ready.';
  primaryCta = 'Open Experience';
  primaryLink = '/studio';
  remembered: string[] = [];

  ngOnInit() {
    this.ctx.touchLastSeen();
    if (!this.ctx.hasExperiences()) {
      this.returning = false;
      return;
    }

    this.returning = true;
    const active = this.ctx.activeExperience();
    const c = this.ctx.readConfig();
    this.live = c.live;
    this.venue = this.ctx.displayVenue() || experienceLabel(c.typeId) || 'Your experience';
    const hour = new Date().getHours();
    const hello =
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const first = this.auth.read().name?.trim().split(/\s+/)[0];
    this.greeting = first ? `${hello}, ${first}.` : `${hello}.`;

    if (this.live) {
      this.readiness = 'Everything is ready.';
      this.primaryCta = 'Open Experience';
      this.primaryLink = '/studio/setup/golive';
    } else {
      const progress = this.ctx.setupProgress();
      const next = progress.current === 'done' ? 'golive' : progress.current;
      this.readiness =
        progress.done >= progress.total - 1
          ? 'You’re ready to welcome guests.'
          : 'Almost ready to welcome guests.';
      this.primaryCta = next === 'golive' ? 'Go live' : 'Continue setup';
      this.primaryLink = this.ctx.pathForStep(next);
    }

    const typeLabel = experienceLabel(active?.typeId);
    this.remembered = [
      typeLabel ? `${typeLabel} experience` : '',
      active?.logoUrl ? 'Logo remembered' : '',
      active?.brandColour ? 'Brand colour remembered' : '',
      active?.location?.trim() ? `Location · ${active.location.trim()}` : '',
      c.paymentsDone ? 'Payments remembered' : '',
    ].filter(Boolean);
  }
}
