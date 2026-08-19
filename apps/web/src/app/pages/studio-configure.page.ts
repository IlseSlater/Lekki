import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';

const TOKEN_BY_PACK: Record<string, string> = {
  restaurant: 'qr-demo-restaurant',
  cafe: 'qr-demo-cafe',
  hotel: 'qr-demo-hotel',
  festival: 'qr-demo-festival',
  airport: 'qr-demo-airport',
  healthcare: 'qr-demo-healthcare',
};

/** Studio S2 — Configure venue & places (guided; seed-backed tokens for demo). */
@Component({
  standalone: true,
  imports: [FormsModule, ExperienceScreenComponent, RouterLink],
  template: `
    <leos-experience-screen
      purpose="Configure your venue"
      lead="Name the place once — guests will join it."
      help=""
      [showFooter]="true"
    >
      <div class="leos-field">
        <span class="leos-field__label">Venue name</span>
        <input class="leos-field__input" [(ngModel)]="venueName" name="venue" />
      </div>
      <div class="leos-field" style="margin-top:1.5rem;">
        <span class="leos-field__label">First place</span>
        <input class="leos-field__input" [(ngModel)]="placeCode" name="place" />
      </div>
      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/choose">Back</a>
      <button primary type="button" class="leos-btn leos-btn--primary" (click)="continue()">
        Continue
      </button>
    </leos-experience-screen>
  `,
})
export class StudioConfigurePageComponent {
  private readonly router = inject(Router);
  venueName = 'Blue Door';
  placeCode = 'Table 12';
  packId = localStorage.getItem('leos.studio.pack') ?? 'restaurant';

  get packLabel() {
    return this.packId.charAt(0).toUpperCase() + this.packId.slice(1);
  }

  get token() {
    return TOKEN_BY_PACK[this.packId] ?? 'qr-demo-restaurant';
  }

  continue() {
    localStorage.setItem(
      'leos.studio.config',
      JSON.stringify({
        venueName: this.venueName,
        placeCode: this.placeCode,
        packId: this.packId,
        token: this.token,
      }),
    );
    void this.router.navigate(['/studio/payments']);
  }
}
