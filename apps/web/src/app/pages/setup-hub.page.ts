import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';

/** Provider Setup hub — only ship what’s real in this build. */
const MODULES = [
  {
    id: 'organisation',
    title: 'Organisation',
    desc: 'Confirm organisation, venue, and physical context.',
    link: '/setup/organisation',
  },
  {
    id: 'operate',
    title: 'Operate',
    desc: 'Stations and floor assistance — run the live experience.',
    link: '/setup/operate',
  },
  {
    id: 'golive',
    title: 'Go Live',
    desc: 'QR entry for your venue — guests scan to join.',
    link: '/setup/golive',
  },
  {
    id: 'payments',
    title: 'Payments',
    desc: 'Connect settlement for this experience.',
    link: '/setup/payments',
  },
] as const;

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ExperienceScreenComponent],
  template: `
    <leos-experience-screen
      purpose="Create & configure"
      lead="Prepare your organisation, go live with QR, then operate the experience."
      help="Provider Journey — Create · Configure · Activate · Operate. Only shipped surfaces."
      [showFooter]="false"
    >
      <div class="leos-visual-cards leos-visual-cards--two">
        @for (m of modules; track m.id) {
          <a class="leos-visual-card setup-hub-card" [routerLink]="m.link">
            <div class="setup-card__head">
              <h3 class="leos-visual-card__title">{{ m.title }}</h3>
              <span class="leos-pill leos-pill--ready">Open</span>
            </div>
            <p class="leos-visual-card__desc">{{ m.desc }}</p>
            <p class="setup-hub-card__cta">Continue →</p>
          </a>
        }
      </div>
    </leos-experience-screen>
  `,
})
export class SetupHubPageComponent {
  readonly modules = MODULES;
}
