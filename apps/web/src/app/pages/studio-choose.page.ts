import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';

const PACKS = [
  { id: 'restaurant', label: 'Restaurant', hint: 'Shared dining · kitchen & bar' },
  { id: 'cafe', label: 'Café', hint: 'Counter · board & pickup' },
  { id: 'hotel', label: 'Hotel', hint: 'Room service' },
  { id: 'festival', label: 'Festival', hint: 'Zone · food truck' },
  { id: 'airport', label: 'Airport', hint: 'Gate seat' },
  { id: 'healthcare', label: 'Healthcare', hint: 'Waiting bay' },
] as const;

/** Studio S1 — Choose Experience (Pack template) */
@Component({
  standalone: true,
  imports: [ExperienceScreenComponent, RouterLink],
  template: `
    <leos-experience-screen
      purpose="What kind of experience?"
      lead="Pick the one that matches how guests will join."
      help=""
      [showFooter]="true"
    >
      <div class="leos-visual-cards leos-visual-cards--two">
        @for (p of packs; track p.id) {
          <button
            type="button"
            class="leos-visual-card"
            [class.leos-visual-card--selected]="selected === p.id"
            (click)="selected = p.id"
          >
            <p class="leos-visual-card__title">{{ p.label }}</p>
            <p class="leos-visual-card__desc">{{ p.hint }}</p>
          </button>
        }
      </div>
      <a escape class="leos-btn leos-btn--secondary" routerLink="/studio/welcome">Back</a>
      <button
        primary
        type="button"
        class="leos-btn leos-btn--primary"
        [disabled]="!selected"
        (click)="continue()"
      >
        Continue
      </button>
    </leos-experience-screen>
  `,
})
export class StudioChoosePageComponent {
  private readonly router = inject(Router);
  readonly packs = PACKS;
  selected = localStorage.getItem('leos.studio.pack') ?? '';

  continue() {
    if (!this.selected) return;
    localStorage.setItem('leos.studio.pack', this.selected);
    void this.router.navigate(['/studio/configure']);
  }
}
