import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Presentation phase for header morphing — mapped from GuestSessionService.phase. */
export type GuestHeaderPhase = 'menu' | 'cart' | 'pay';

/**
 * Dumb guest header — brand cover/logo only.
 * Smart container owns GuestSessionService; this component never injects it.
 */
@Component({
  selector: 'lekki-guest-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header
      class="leos-guest-header"
      [attr.aria-label]="ariaLabel"
      [attr.data-phase]="currentPhase"
    >
      <div
        class="leos-menu-brand"
        [style.--menu-brand-progress]="brandProgress"
        [style.--menu-brand-colour]="brandColour"
        aria-hidden="true"
      >
        <div class="leos-menu-brand__fill">
          @if (menuCoverUrl) {
            <img class="leos-menu-brand__cover" [src]="menuCoverUrl" alt="" />
          }
          <span class="leos-menu-brand__shade"></span>
          @if (logoUrl) {
            <img class="leos-menu-brand__logo" [src]="logoUrl" alt="" />
          }
        </div>
      </div>
    </header>
  `,
})
export class GuestHeaderComponent {
  @Input({ required: true }) venueName!: string;
  @Input() logoUrl?: string | null;
  @Input() menuCoverUrl?: string | null;
  @Input() physicalContextLabel?: string;
  @Input({ required: true }) currentPhase!: GuestHeaderPhase;
  /** Identity brand colour for the half-moon fill. */
  @Input() brandColour = '#d7a14a';
  /** Scroll collapse progress 0–1 (owned by the smart container). */
  @Input() brandProgress = 0;

  @Output() requestHelp = new EventEmitter<void>();
  @Output() viewOrders = new EventEmitter<void>();

  get ariaLabel(): string {
    const place = (this.physicalContextLabel || '').trim();
    if (place) return `${this.venueName} · ${place}`;
    return this.venueName;
  }
}
