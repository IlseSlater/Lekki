import { Component, Input } from '@angular/core';
import { LiveExperiencePanelComponent } from './live-experience-panel.component';

/**
 * Studio workspace — Setup story | expanding craft | Live phone far right.
 * Mid widths stack story above; craft still fills between and phone stays right.
 */
@Component({
  selector: 'leos-studio-workspace',
  standalone: true,
  imports: [LiveExperiencePanelComponent],
  template: `
    <div class="studio-ws" [class.studio-ws--with-story]="withStory">
      <div class="studio-ws__body">
        @if (withStory) {
          <aside class="studio-ws__story studio-motion-appear" aria-label="Setup progress">
            <ng-content select="[story]" />
          </aside>
        }
        <div class="studio-ws__studio studio-motion-appear">
          <ng-content />
        </div>
        <div class="studio-ws__live studio-motion-appear-delay">
          <leos-live-experience-panel />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .studio-ws {
        width: 100%;
        max-width: calc(var(--studio-studio-width, 640px) + var(--studio-live-width, 420px) + 6rem);
        margin: 0 auto;
        padding: var(--studio-pad-outer, 48px) var(--studio-pad-outer, 48px) 3rem;
        box-sizing: border-box;
        min-width: 0;
      }
      .studio-ws--with-story {
        --studio-story-width: 14rem;
        max-width: none;
        width: 100%;
        padding-left: clamp(1rem, 2vw, 1.75rem);
        padding-right: clamp(1rem, 2vw, 1.75rem);
      }
      .studio-ws__body {
        display: grid;
        gap: 2rem;
        align-items: start;
        min-width: 0;
      }
      .studio-ws__story {
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        padding: 0.25rem 0 1rem;
        border-bottom: 1px solid var(--leos-border, #eae6e1);
        box-sizing: border-box;
      }
      .studio-ws__story > * {
        max-width: 100%;
      }
      .studio-ws__studio {
        min-width: 0;
        max-width: var(--studio-studio-width, 640px);
        width: 100%;
      }
      .studio-ws--with-story .studio-ws__studio {
        max-width: none;
      }
      .studio-ws__live {
        min-width: 0;
        display: flex;
        justify-content: center;
        padding-top: 0.5rem;
      }

      /* Dual-pane without story — craft left, phone right */
      @media (min-width: 1024px) {
        .studio-ws:not(.studio-ws--with-story) .studio-ws__body {
          grid-template-columns: minmax(0, 1fr) var(--studio-live-width, 420px);
          justify-content: stretch;
          gap: 2rem 3rem;
        }
        .studio-ws:not(.studio-ws--with-story) .studio-ws__studio {
          max-width: var(--studio-studio-width, 640px);
        }
        .studio-ws:not(.studio-ws--with-story) .studio-ws__live {
          position: sticky;
          top: 1.25rem;
          justify-self: end;
          width: var(--studio-live-width, 420px);
          min-width: var(--studio-live-width, 420px);
        }
      }

      /* Mid: story above; craft fills · phone far right */
      @media (min-width: 1024px) and (max-width: 1399px) {
        .studio-ws--with-story .studio-ws__body {
          grid-template-columns: minmax(0, 1fr) var(--studio-live-width, 420px);
          grid-template-areas:
            'story story'
            'studio live';
          column-gap: 2rem;
          row-gap: 1.5rem;
        }
        .studio-ws--with-story .studio-ws__story {
          grid-area: story;
          position: static;
          border-right: none;
          border-bottom: 1px solid var(--leos-border, #eae6e1);
          padding: 0.25rem 0 1rem;
          overflow: hidden;
        }
        .studio-ws--with-story .studio-ws__studio {
          grid-area: studio;
          max-width: none;
        }
        .studio-ws--with-story .studio-ws__live {
          grid-area: live;
          position: sticky;
          top: 1.25rem;
          justify-self: end;
          width: var(--studio-live-width, 420px);
          min-width: var(--studio-live-width, 420px);
        }
      }

      /* Wide: Setup engine | expanding article | phone far right */
      @media (min-width: 1400px) {
        .studio-ws--with-story {
          --studio-story-width: 14rem;
        }
        .studio-ws--with-story .studio-ws__body {
          grid-template-columns:
            var(--studio-story-width)
            minmax(0, 1fr)
            var(--studio-live-width, 420px);
          grid-template-areas: none;
          column-gap: 2rem;
          row-gap: 1.75rem;
          width: 100%;
        }
        .studio-ws--with-story .studio-ws__story {
          grid-column: 1;
          grid-area: auto;
          position: sticky;
          top: 1.25rem;
          width: var(--studio-story-width);
          max-width: var(--studio-story-width);
          justify-self: start;
          border-bottom: none;
          border-right: 1px solid var(--studio-line, var(--leos-border, #eae6e1));
          padding: 0.25rem 1rem 0.5rem 0;
          overflow: hidden;
        }
        .studio-ws--with-story .studio-ws__story > * {
          width: 100%;
          max-width: 100%;
        }
        .studio-ws--with-story .studio-ws__studio {
          grid-column: 2;
          grid-area: auto;
          max-width: none;
          width: 100%;
          justify-self: stretch;
        }
        .studio-ws--with-story .studio-ws__live {
          grid-column: 3;
          grid-area: auto;
          position: sticky;
          top: 1.25rem;
          justify-self: end;
          width: var(--studio-live-width, 420px);
          min-width: var(--studio-live-width, 420px);
        }
      }

      @media (max-width: 1023px) {
        .studio-ws__live {
          order: -1;
          position: static;
        }
        .studio-ws {
          padding: 1.5rem 1.25rem 2.5rem;
        }
      }
    `,
  ],
})
export class StudioWorkspaceComponent {
  /** When true, projects [story] as a left Setup progress panel. */
  @Input() withStory = false;
}
