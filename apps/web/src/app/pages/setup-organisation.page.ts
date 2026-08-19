import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';

/**
 * Provider Configure — seed organisation / venues (matches db:seed).
 * Full Create CRUD waits on Studio APIs; this is Configure truth for the demo.
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ExperienceScreenComponent],
  template: `
    <leos-experience-screen
      purpose="Your organisation"
      lead="What’s ready for this demo — then continue to QR."
      help=""
      [showFooter]="true"
    >
      <div class="leos-item-row">
        <div>
          <strong>Organisation</strong>
          <div class="leos-muted">{{ org }}</div>
        </div>
        <span class="leos-pill leos-pill--ready">Ready</span>
      </div>

      <p class="leos-muted" style="margin:1.5rem 0 0.5rem;">Venues</p>
      @for (v of venues; track v.name) {
        <div class="leos-item-row">
          <div>
            <strong>{{ v.name }}</strong>
            <div class="leos-muted">{{ v.pack }} · {{ v.context }}</div>
          </div>
          <span class="leos-pill leos-pill--ready">Ready</span>
        </div>
      }

      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio">Back</a>
      <a primary class="leos-btn leos-btn--primary" routerLink="/studio/golive">Continue</a>
    </leos-experience-screen>
  `,
})
export class SetupOrganisationPageComponent {
  readonly org = 'Lekki Demo Hospitality';
  readonly venues = [
    {
      name: 'Rusty Oak',
      pack: 'Restaurant',
      context: 'T1',
      token: 'qr-demo-restaurant',
    },
    {
      name: 'Harbor Roast Café',
      pack: 'Café',
      context: 'C1',
      token: 'qr-demo-cafe',
    },
    {
      name: 'Harbor House Hotel',
      pack: 'Hotel',
      context: '1204',
      token: 'qr-demo-hotel',
    },
    {
      name: 'Lekki Fields Festival',
      pack: 'Festival',
      context: 'ZONE-A',
      token: 'qr-demo-festival',
    },
    {
      name: 'Lekki International Gate B12',
      pack: 'Airport',
      context: 'B12-14',
      token: 'qr-demo-airport',
    },
    {
      name: 'Harbor Day Clinic',
      pack: 'Healthcare',
      context: 'BAY-3',
      token: 'qr-demo-healthcare',
    },
  ] as const;
}
