import { Component, Input } from '@angular/core';
import { LiveExperiencePanelComponent } from './live-experience-panel.component';

/**
 * Studio workspace — one paper (story + craft) · Live phone on the ground.
 */
@Component({
  selector: 'leos-studio-workspace',
  standalone: true,
  imports: [LiveExperiencePanelComponent],
  template: `
    <div class="studio-ws" [class.studio-ws--with-story]="withStory">
      <div class="studio-ws__body">
        <div class="studio-ws__paper" [class.studio-ws__paper--solo]="!withStory">
          @if (withStory) {
            <aside class="studio-ws__story" aria-label="Setup progress">
              <ng-content select="[story]" />
            </aside>
          }
          <div class="studio-ws__studio studio-motion-appear">
            <ng-content />
          </div>
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
        container-type: inline-size;
        container-name: studio-setup;
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
        --studio-story-width: 12rem;
        --studio-live-width: 21.5rem;
        max-width: none;
        width: 100%;
        padding: 1rem clamp(0.85rem, 1.5vw, 1.5rem) 1.5rem;
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
      .studio-ws__paper {
        min-width: 0;
        display: grid;
        gap: 0;
      }
      .studio-ws__paper--solo {
        display: contents;
      }
      .studio-ws__live {
        min-width: 0;
        display: flex;
        justify-content: center;
        padding-top: 0.5rem;
      }

      /* Paper first. Phone sits underneath at full size until there is room beside. */
      .studio-ws--with-story .studio-ws__body {
        grid-template-columns: minmax(0, 1fr);
        row-gap: 2rem;
      }
      .studio-ws--with-story .studio-ws__live {
        order: 2;
        position: static;
        justify-content: center;
        width: 100%;
        padding: 0 0 1.5rem;
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

      /* Phone at true size, to the right of the paper — only when both fit */
      @container studio-setup (min-width: 58rem) {
        .studio-ws--with-story .studio-ws__body {
          grid-template-columns: minmax(0, 1fr) var(--studio-live-width, 21.5rem);
          align-items: start;
          column-gap: 1.25rem;
          row-gap: 0;
          width: 100%;
        }
        .studio-ws--with-story .studio-ws__paper {
          grid-template-columns: var(--studio-story-width) minmax(0, 1fr);
          align-items: stretch;
          min-height: min(70vh, 42rem);
        }
        .studio-ws--with-story .studio-ws__story {
          width: auto;
          max-width: none;
          border-bottom: none;
          padding: 1.15rem 1.1rem 1.35rem 1.15rem;
          overflow: hidden;
        }
        .studio-ws--with-story .studio-ws__story > * {
          width: 100%;
          max-width: 100%;
        }
        .studio-ws--with-story .studio-ws__studio {
          max-width: none;
          width: 100%;
          min-width: 0;
          border-left: 1px solid var(--studio-line, var(--leos-border, #eae6e1));
        }
        .studio-ws--with-story .studio-ws__live {
          position: sticky;
          top: 1rem;
          justify-self: end;
          width: var(--studio-live-width, 21.5rem);
          max-width: var(--studio-live-width, 21.5rem);
          padding: 0;
        }
      }

      @media (max-width: 1023px) {
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
