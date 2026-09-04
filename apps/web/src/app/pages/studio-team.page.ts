import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LeosApiService } from '../services/leos-api.service';
import { StudioContextService } from '../services/studio-context.service';
import {
  STAFF_EXPERIENCES,
  defaultPermissionsForRole,
  permissionsForExperience,
  staffExperiencesForType,
} from '../studio/staff-paths';
import type { ExperienceTypeId } from '../studio/experience-registry';
import {
  canDoSummary,
  deviceTrust,
  permissionGroupsFor,
  sessionOnDevice,
  sessionRevokeCopy,
} from '../studio/team-confidence';

type TeamMember = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  organisationId: string;
  permissions: string[];
  homePath: string;
};

/**
 * Studio Team — Experience Assignment first, permissions refine.
 * ADR-004.
 */
@Component({
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div
      class="studio-team studio-motion-appear"
      [class.studio-team--editing]="!!draft"
    >
      <div class="studio-team__main">
        <header class="studio-team__header">
          <p class="studio-team__eyebrow">Team</p>
          <h1 class="studio-team__title">{{ venue }}</h1>
          <p class="studio-team__calm">
            {{ question }}
          </p>
        </header>

        @if (error) {
          <p class="studio-team__alert" role="alert">{{ error }}</p>
        }
        @if (flash) {
          <p class="studio-team__flash" role="status">{{ flash }}</p>
        }

        @if (area === 'people') {
          <section class="studio-team__people" aria-label="Staff">
            @if (members.length) {
              <div class="studio-team__filters" role="group" aria-label="Filter by section">
                @for (f of sectionFilters; track f.id) {
                  <button
                    type="button"
                    class="studio-team__filter"
                    [class.studio-team__filter--on]="sectionFilter === f.id"
                    (click)="setSectionFilter(f.id)"
                  >
                    {{ f.label }}
                  </button>
                }
              </div>
              @if (visibleMembers.length) {
                <div class="studio-team__tray">
                  <div class="studio-team__grid">
                    @for (m of visibleMembers; track m.id) {
                      <button
                        type="button"
                        class="studio-team__card"
                        [class.studio-team__card--active]="selected?.id === m.id"
                        (click)="open(m)"
                      >
                        <span
                          class="studio-team__avatar"
                          [attr.data-tone]="avatarTone(m)"
                          aria-hidden="true"
                        >
                          {{ initials(m.displayName) }}
                        </span>
                        <span class="studio-team__role-mark" [attr.data-role]="m.role">
                          {{ experienceLabel(m.role) }}
                        </span>
                        <span class="studio-team__card-copy">
                          <span class="studio-team__card-name">{{ personName(m) }}</span>
                          <span class="studio-team__card-meta">
                            @if (personDevice(m.id); as device) {
                              On {{ device }}
                            } @else {
                              {{ personCardMeta(m) }}
                            }
                          </span>
                        </span>
                      </button>
                    }
                  </div>
                </div>
              } @else {
                <p class="studio-team__calm">No one in this section yet.</p>
              }
            } @else {
              <p class="studio-team__calm">
                @if (loading) {
                  Loading team…
                } @else {
                  No staff yet — add someone below.
                }
              </p>
            }
          </section>
        }

        <div class="studio-team__actions">
          <button type="button" class="leos-btn leos-btn--primary" (click)="startCreate()">
            Add staff
          </button>
          <a class="leos-btn" routerLink="/staff">Open Staff Experience</a>
        </div>

        <div class="floor-tabs studio-team__tabs" role="tablist" aria-label="Team areas">
          <button type="button" class="floor-tabs__btn" [class.floor-tabs__btn--on]="area === 'people'" (click)="setArea('people')">People</button>
          <button type="button" class="floor-tabs__btn" [class.floor-tabs__btn--on]="area === 'devices'" (click)="setArea('devices')">Devices</button>
          <button type="button" class="floor-tabs__btn" [class.floor-tabs__btn--on]="area === 'sessions'" (click)="setArea('sessions')">Sessions</button>
        </div>

        @if (area === 'devices') {
          <section class="studio-team__list" aria-label="Devices">
            @for (d of devices; track d.id) {
              <article class="studio-team__row studio-team__row--static">
                <span class="studio-team__name">{{ d.label }}</span>
                <span class="studio-team__exp">
                  {{ deviceLine(d) }}
                </span>
              </article>
            } @empty {
              <p class="studio-team__calm">No named devices yet — add a Kitchen Tablet or Bar Tablet.</p>
            }
            <div class="studio-team__actions">
              <label class="studio-team__sr" for="team-device-label">Device name</label>
              <input id="team-device-label" class="studio-team__input" [(ngModel)]="newDeviceLabel" placeholder="Kitchen Tablet" />
              <button type="button" class="leos-btn leos-btn--primary" [disabled]="!newDeviceLabel.trim()" (click)="addDevice()">
                Add device
              </button>
            </div>
          </section>
        }

        @if (area === 'sessions') {
          <section class="studio-team__list" aria-label="Logins" (click)="onSessionsClick($event)">
            @for (s of sessions; track s.id) {
              <article class="studio-team__row studio-team__row--static">
                <span class="studio-team__name">{{ s.displayName }} · {{ s.deviceLabel || 'This device' }}</span>
                <span class="studio-team__exp">
                  {{ s.active ? 'Active' : 'Ended' }} · {{ revokeCopy(s).consequence }}
                  @if (s.active) {
                    <button type="button" class="studio-team__revoke" [attr.data-revoke]="s.id">
                      {{ revokeCopy(s).action }}
                    </button>
                  } @else {
                    <span class="studio-team__ended">{{ revokeCopy(s).after }}</span>
                  }
                </span>
              </article>
            } @empty {
              <p class="studio-team__calm">No logins yet.</p>
            }
          </section>
        }
      </div>

      <aside
        class="studio-team__rail"
        [class.studio-team__rail--open]="!!draft"
        [attr.aria-hidden]="draft ? null : 'true'"
      >
        @if (draft) {
          <section
            class="studio-team__editor"
            [attr.aria-label]="draft.id ? 'Edit staff' : 'Add staff'"
          >
            <div class="studio-team__editor-head">
              <h2 class="studio-team__editor-title">{{ draft.id ? draft.displayName : 'New staff' }}</h2>
              <button type="button" class="studio-team__editor-close" (click)="cancel()" aria-label="Close editor">
                ×
              </button>
            </div>

            <label class="studio-team__label" for="team-name">Name</label>
            <input id="team-name" class="studio-team__input" [(ngModel)]="draft.displayName" />

            @if (!draft.id) {
              <label class="studio-team__label" for="team-email">Email</label>
              <input id="team-email" class="studio-team__input" [(ngModel)]="draft.email" autocomplete="off" />
              <label class="studio-team__label" for="team-pin">PIN</label>
              <input
                id="team-pin"
                class="studio-team__input"
                type="password"
                inputmode="numeric"
                maxlength="6"
                [(ngModel)]="draft.pin"
                placeholder="••••"
              />
            } @else {
              <label class="studio-team__label" for="team-pin-reset">Reset PIN (optional)</label>
              <input
                id="team-pin-reset"
                class="studio-team__input"
                type="password"
                inputmode="numeric"
                maxlength="6"
                [(ngModel)]="draft.pin"
                placeholder="Leave blank to keep"
              />
            }

            <p class="studio-team__label">Experience</p>
            <div class="studio-team__experiences" role="radiogroup" aria-label="Experience">
              @for (exp of experiences; track exp.id) {
                <label class="studio-team__exp-card">
                  <input
                    type="radio"
                    name="experience"
                    [value]="exp.id"
                    [(ngModel)]="draft.role"
                    (ngModelChange)="onExperienceChange()"
                  />
                  <span class="studio-team__exp-label">{{ exp.label }}</span>
                  <span class="studio-team__exp-blurb">{{ exp.blurb }}</span>
                </label>
              }
            </div>

            <p class="studio-team__label">What they can do</p>
            <p class="studio-team__hint">Experience first — then refine if you need to.</p>
            <div class="studio-team__perms">
              @for (g of groupedPermissions; track g.id) {
                <fieldset class="studio-team__group">
                  <legend class="studio-team__group-title">{{ g.title }}</legend>
                  <p class="studio-team__group-why">{{ g.why }}</p>
                  @for (p of g.items; track p.id) {
                    <label class="studio-team__perm">
                      <input type="checkbox" [checked]="hasPerm(p.id)" (change)="togglePerm(p.id, $event)" />
                      {{ p.label }}
                    </label>
                  }
                </fieldset>
              }
            </div>

            <div class="studio-team__actions studio-team__actions--editor">
              <button type="button" class="leos-btn leos-btn--primary" [disabled]="busy" (click)="save()">
                {{ busy ? 'Saving…' : draft.id ? 'Save' : 'Create' }}
              </button>
              <button type="button" class="leos-btn" [disabled]="busy" (click)="cancel()">Cancel</button>
            </div>
          </section>
        }
      </aside>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .studio-team {
        display: grid;
        grid-template-columns: minmax(0, 60%) minmax(0, 40%);
        align-items: start;
        gap: 0;
        padding: 0.5rem 0 2rem;
        transition: grid-template-columns var(--studio-duration-settle, 360ms)
          var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .studio-team--editing {
        grid-template-columns: minmax(0, 60%) minmax(0, 40%);
        column-gap: 0;
      }
      .studio-team__main {
        min-width: 0;
        width: 100%;
        max-width: 100%;
        transition: padding-right var(--studio-duration-enter, 280ms)
          var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .studio-team--editing .studio-team__main {
        padding-right: 1.25rem;
      }
      .studio-team__rail {
        min-width: 0;
        width: 100%;
        overflow: hidden;
        opacity: 0;
        transform: translateX(1.25rem);
        pointer-events: none;
        box-sizing: border-box;
        transition:
          opacity var(--studio-duration, 220ms) var(--studio-ease-soft, cubic-bezier(0.33, 1, 0.68, 1)),
          transform var(--studio-duration-settle, 360ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1)),
          border-color var(--studio-duration, 220ms) var(--studio-ease),
          padding var(--studio-duration-enter, 280ms) var(--studio-ease),
          background var(--studio-duration, 220ms) var(--studio-ease),
          box-shadow var(--studio-duration, 220ms) var(--studio-ease);
      }
      .studio-team__rail--open {
        position: sticky;
        top: 1.25rem;
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
        overflow: visible;
        padding: 0;
        border-radius: 1.5rem;
        background: #fff;
        border: 1px solid var(--studio-line, #e7e2db);
        box-shadow: 0 1px 2px rgba(27, 34, 48, 0.04);
      }
      .studio-team__rail--open .studio-team__editor {
        padding: 1.15rem 1.15rem 1.25rem;
      }
      .studio-team__header {
        max-width: 40rem;
      }
      .studio-team__eyebrow {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 650;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .studio-team__title {
        margin: 0.35rem 0 0;
        font-size: 1.75rem;
        font-weight: 650;
        letter-spacing: -0.03em;
      }
      .studio-team__calm {
        margin: 0.5rem 0 0;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .studio-team__alert {
        color: #b42318;
      }
      .studio-team__flash {
        color: var(--leos-success, #4f8a6b);
      }
      .studio-team__people {
        margin-top: 1.25rem;
      }
      .studio-team__filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-bottom: 0.85rem;
      }
      .studio-team__filter {
        min-height: 2.15rem;
        padding: 0 0.8rem;
        border-radius: 999px;
        border: 1px solid var(--studio-line, #e7e2db);
        background: #fff;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 650;
        color: var(--studio-ink, #1b2230);
        cursor: pointer;
      }
      .studio-team__filter--on {
        background: var(--leos-gold, #d7a14a);
        border-color: var(--leos-gold, #d7a14a);
        color: #1b2230;
      }
      .studio-team__tray {
        padding: 0.85rem;
        border-radius: 1.5rem;
        background: #fff;
        border: 1px solid var(--studio-line, #e7e2db);
        box-shadow: 0 1px 2px rgba(27, 34, 48, 0.04);
      }
      .studio-team__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
      }
      @media (min-width: 720px) {
        .studio-team__grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
      }
      @media (min-width: 1100px) {
        .studio-team__grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      .studio-team--editing .studio-team__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (min-width: 1280px) {
        .studio-team--editing .studio-team__grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      .studio-team__card {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 1.25rem;
        min-height: 8.5rem;
        width: 100%;
        text-align: left;
        padding: 0.9rem 0.85rem 0.85rem;
        border-radius: 1rem;
        border: 1px solid transparent;
        background: #f4f1ec;
        font: inherit;
        color: inherit;
        cursor: pointer;
        transition:
          border-color 160ms ease,
          background 160ms ease,
          box-shadow 160ms ease;
      }
      .studio-team__card:hover {
        background: #efeae3;
      }
      .studio-team__card--active {
        border-color: rgba(215, 161, 74, 0.65);
        box-shadow: 0 0 0 1px rgba(215, 161, 74, 0.25);
        background: #fffaf2;
      }
      .studio-team__avatar {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        display: grid;
        place-items: center;
        width: 2.35rem;
        height: 2.35rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: #fff;
        background: linear-gradient(145deg, #c4a574, #8f7350);
      }
      .studio-team__avatar[data-tone='1'] {
        background: linear-gradient(145deg, #6b8f7a, #0d3a2f);
      }
      .studio-team__avatar[data-tone='2'] {
        background: linear-gradient(145deg, #d7a14a, #a67c2e);
      }
      .studio-team__avatar[data-tone='3'] {
        background: linear-gradient(145deg, #7a8494, #1b2230);
      }
      .studio-team__avatar[data-tone='4'] {
        background: linear-gradient(145deg, #c98b7b, #8a4f42);
      }
      .studio-team__role-mark {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        max-width: calc(100% - 3rem);
        min-height: 1.55rem;
        padding: 0.15rem 0.5rem;
        border-radius: 0.45rem;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        line-height: 1.2;
        color: #0d3a2f;
        background: rgba(13, 58, 47, 0.1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .studio-team__role-mark[data-role='bar'] {
        color: #7a4e12;
        background: rgba(215, 161, 74, 0.22);
      }
      .studio-team__role-mark[data-role='kitchen'] {
        color: #6b3a2e;
        background: rgba(201, 139, 123, 0.28);
      }
      .studio-team__role-mark[data-role='waiter'] {
        color: #0d3a2f;
        background: rgba(13, 58, 47, 0.12);
      }
      .studio-team__role-mark[data-role='counter'] {
        color: #1b2230;
        background: rgba(27, 34, 48, 0.1);
      }
      .studio-team__role-mark[data-role='staff'] {
        color: #5a4630;
        background: rgba(196, 165, 116, 0.28);
      }
      .studio-team__card-copy {
        display: grid;
        gap: 0.2rem;
        min-width: 0;
        padding-right: 0.25rem;
      }
      .studio-team__card-name {
        font-weight: 700;
        font-size: 0.95rem;
        letter-spacing: -0.02em;
        color: var(--studio-ink, #1b2230);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .studio-team__card-meta {
        font-size: 0.75rem;
        line-height: 1.35;
        color: var(--studio-ink-secondary, #6b7280);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .studio-team__list {
        display: grid;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }
      .studio-team__row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        width: 100%;
        text-align: left;
        padding: 0.9rem 1rem;
        border-radius: 0.85rem;
        border: 1px solid var(--studio-line, #e7e2db);
        background: #fff;
        font: inherit;
        cursor: pointer;
      }
      .studio-team__row--static {
        cursor: default;
      }
      .studio-team__row--active,
      button.studio-team__row:hover {
        border-color: rgba(215, 161, 74, 0.55);
      }
      .studio-team__on {
        font-weight: 550;
        color: var(--studio-ink, #1b2230);
      }
      .studio-team__hint {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .studio-team__group {
        margin: 0;
        padding: 0.65rem 0 0.25rem;
        border: 0;
        border-top: 1px solid var(--studio-line, #e7e2db);
      }
      .studio-team__group-title {
        padding: 0;
        font-size: 0.8125rem;
        font-weight: 700;
      }
      .studio-team__group-why {
        margin: 0.15rem 0 0.45rem;
        font-size: 0.75rem;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .studio-team__ended {
        margin-left: 0.35rem;
        font-size: 0.75rem;
      }
      .studio-team__sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }
      .studio-team__name {
        font-weight: 650;
      }
      .studio-team__exp {
        color: var(--studio-ink-secondary, #6b7280);
        font-size: 0.875rem;
      }
      .studio-team__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
        margin-top: 1.25rem;
      }
      .studio-team__actions--editor {
        margin-top: 1rem;
        padding-bottom: 0.5rem;
      }
      .studio-team__editor {
        display: grid;
        gap: 0.55rem;
        width: 100%;
        min-width: 0;
        padding-bottom: 1rem;
        animation: team-editor-rise var(--studio-duration-enter, 280ms)
          var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      @keyframes team-editor-rise {
        from {
          opacity: 0;
          transform: translateY(0.5rem);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .studio-team__editor-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.25rem;
      }
      .studio-team__editor-title {
        margin: 0;
        font-size: 1.15rem;
        letter-spacing: -0.02em;
      }
      .studio-team__editor-close {
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0.5rem;
        background: transparent;
        color: var(--studio-ink-secondary, #6b7280);
        font: inherit;
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
      }
      .studio-team__editor-close:hover {
        color: var(--studio-ink, #1b2230);
        background: rgba(27, 34, 48, 0.06);
      }
      .studio-team__label {
        margin: 0.5rem 0 0;
        font-size: 0.75rem;
        font-weight: 650;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .studio-team__input {
        min-height: 2.6rem;
        padding: 0 0.75rem;
        border-radius: 0.65rem;
        border: 1px solid var(--studio-line, #e7e2db);
        font: inherit;
        width: 100%;
        box-sizing: border-box;
      }
      .studio-team__experiences {
        display: grid;
        gap: 0.45rem;
      }
      .studio-team__exp-card {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
        column-gap: 0.65rem;
        align-items: start;
        padding: 0.65rem 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--studio-line, #e7e2db);
        cursor: pointer;
      }
      .studio-team__exp-card input {
        grid-row: 1 / span 2;
        margin-top: 0.2rem;
      }
      .studio-team__exp-label {
        font-weight: 650;
      }
      .studio-team__exp-blurb {
        font-size: 0.8rem;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .studio-team__perms {
        display: grid;
        gap: 0.4rem;
      }
      .studio-team__perm {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
      }
      .studio-team__tabs {
        margin-top: 1.25rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }
      .floor-tabs__btn {
        min-height: 2.5rem;
        padding: 0 0.85rem;
        border-radius: 999px;
        border: 1px solid var(--studio-line, #e7e2db);
        background: #fff;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 650;
        cursor: pointer;
      }
      .floor-tabs__btn--on {
        background: var(--leos-gold, #d7a14a);
        border-color: var(--leos-gold, #d7a14a);
        color: #fff;
      }
      .studio-team__revoke {
        margin-left: 0.5rem;
        border: 0;
        background: none;
        color: #b42318;
        font: inherit;
        font-size: 0.75rem;
        font-weight: 650;
        cursor: pointer;
      }
      @media (max-width: 900px) {
        .studio-team,
        .studio-team--editing {
          grid-template-columns: minmax(0, 100%);
        }
        .studio-team--editing .studio-team__main {
          padding-right: 0;
        }
        .studio-team__rail {
          position: fixed;
          top: 0.75rem;
          right: 0.75rem;
          bottom: 0.75rem;
          z-index: 40;
          width: min(22rem, calc(100vw - 1.5rem));
          background: #fff;
          border: 1px solid var(--studio-line, #e7e2db);
          border-radius: 1.5rem;
          box-shadow: 0 12px 32px rgba(27, 34, 48, 0.1);
          transform: translateX(calc(100% + 1.5rem));
        }
        .studio-team__rail--open {
          transform: translateX(0);
          overflow: auto;
          scrollbar-width: none;
        }
        .studio-team__rail--open::-webkit-scrollbar {
          display: none;
        }
        .studio-team__rail--open .studio-team__editor {
          padding: 1.15rem;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .studio-team,
        .studio-team__rail,
        .studio-team__editor {
          transition: none;
          animation: none;
        }
      }
    `,
  ],
})
export class StudioTeamPageComponent implements OnInit {
  private readonly api = inject(LeosApiService);
  private readonly ctx = inject(StudioContextService);

  experiences = staffExperiencesForType('restaurant');
  experienceTypeId: ExperienceTypeId = 'restaurant';

  venue = 'Your experience';
  area: 'people' | 'devices' | 'sessions' = 'people';
  members: TeamMember[] = [];
  devices: Array<{
    id: string;
    label: string;
    lastStaffName?: string | null;
    lastSeenAt?: string;
    inUse?: boolean;
  }> = [];
  sessions: Array<{
    id: string;
    staffId: string;
    displayName: string;
    deviceLabel?: string | null;
    createdAt: string;
    lastSeenAt?: string;
    active: boolean;
  }> = [];
  newDeviceLabel = '';
  selected: TeamMember | null = null;
  draft: {
    id?: string;
    displayName: string;
    email: string;
    pin: string;
    role: string;
    permissions: string[];
    organisationId: string;
  } | null = null;
  permissionOptions: Array<{ id: string; label: string }> = [];
  loading = true;
  busy = false;
  error = '';
  flash = '';
  sectionFilter: 'all' | string = 'all';

  get question(): string {
    if (this.area === 'devices') return 'Which device is in use?';
    if (this.area === 'sessions') return 'Is it safe to end this login?';
    return 'Who can do what?';
  }

  get sectionFilters(): Array<{ id: string; label: string }> {
    return [{ id: 'all', label: 'All' }, ...this.experiences.map((e) => ({ id: e.id, label: e.label }))];
  }

  get visibleMembers(): TeamMember[] {
    const sorted = [...this.members].sort((a, b) =>
      this.personName(a).localeCompare(this.personName(b), undefined, { sensitivity: 'base' }),
    );
    if (this.sectionFilter === 'all') return sorted;
    return sorted.filter((m) => m.role === this.sectionFilter);
  }

  get groupedPermissions() {
    return permissionGroupsFor(this.permissionOptions);
  }

  get activeDeviceLabels(): Set<string> {
    return new Set(
      this.sessions
        .filter((s) => s.active && s.deviceLabel)
        .map((s) => s.deviceLabel as string),
    );
  }

  personSummary(m: TeamMember): string {
    return canDoSummary(this.experienceLabel(m.role), m.permissions);
  }

  personName(m: TeamMember): string {
    return m.displayName.split('·')[0]?.trim() || m.displayName;
  }

  personCardMeta(m: TeamMember): string {
    const email = m.email?.trim();
    if (email) return email;
    return this.personSummary(m);
  }

  initials(name: string): string {
    const base = name.split('·')[0]?.trim() || name;
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || '?').toUpperCase();
  }

  avatarTone(m: TeamMember): string {
    let hash = 0;
    for (const ch of m.id || m.displayName) hash = (hash + ch.charCodeAt(0) * 17) % 5;
    return String(hash);
  }

  setSectionFilter(id: string) {
    this.sectionFilter = id;
  }

  personDevice(staffId: string): string | null {
    return sessionOnDevice(staffId, this.sessions);
  }

  deviceLine(d: {
    label: string;
    lastStaffName?: string | null;
    lastSeenAt?: string;
    inUse?: boolean;
  }): string {
    const trust = deviceTrust(d, this.activeDeviceLabels);
    const who = d.lastStaffName ? ` · ${d.lastStaffName}` : '';
    return `${trust.state} · ${trust.lastSeen} · ${trust.assigned}${who}`;
  }

  revokeCopy(s: {
    active: boolean;
    deviceLabel?: string | null;
    displayName: string;
  }) {
    return sessionRevokeCopy(s);
  }

  onSessionsClick(event: Event) {
    const target = event.target as HTMLElement | null;
    const btn = target?.closest('[data-revoke]') as HTMLElement | null;
    const id = btn?.getAttribute('data-revoke');
    if (id) this.revokeSession(id);
  }

  ngOnInit() {
    this.venue = this.ctx.displayVenue();
    const typeId = (this.ctx.activeExperience()?.typeId || 'restaurant') as ExperienceTypeId;
    this.experienceTypeId = typeId;
    this.experiences = staffExperiencesForType(typeId);
    this.reload();
  }

  setArea(a: 'people' | 'devices' | 'sessions') {
    this.area = a;
    this.draft = null;
    if (a === 'devices') this.reloadDevices();
    if (a === 'sessions') this.reloadSessions();
  }

  experienceLabel(role: string): string {
    return STAFF_EXPERIENCES.find((e) => e.id === role)?.label || role;
  }

  open(m: TeamMember) {
    this.area = 'people';
    this.selected = m;
    this.draft = {
      id: m.id,
      displayName: m.displayName,
      email: m.email,
      pin: '',
      role: m.role,
      permissions: [...(m.permissions || [])].map((p) =>
        p === 'fulfilment.write' ? 'fulfilment.update' : p,
      ),
      organisationId: m.organisationId,
    };
    this.permissionOptions = permissionsForExperience(m.role, this.experienceTypeId);
    this.error = '';
    this.flash = '';
  }

  startCreate() {
    this.area = 'people';
    const orgId = this.members[0]?.organisationId || '';
    this.selected = null;
    this.draft = {
      displayName: '',
      email: '',
      pin: '',
      role: 'waiter',
      permissions: defaultPermissionsForRole('waiter'),
      organisationId: orgId,
    };
    this.permissionOptions = permissionsForExperience('waiter', this.experienceTypeId);
    this.error = '';
    this.flash = '';
  }

  addDevice() {
    const label = this.newDeviceLabel.trim();
    if (!label) return;
    const organisationId = this.members[0]?.organisationId;
    this.api.createStaffDevice({ organisationId, label }).subscribe({
      next: () => {
        this.newDeviceLabel = '';
        this.flash = 'Device added.';
        this.reloadDevices();
      },
      error: () => (this.error = 'Couldn’t add device — label may already exist.'),
    });
  }

  revokeSession(id: string) {
    this.api.revokeStaffSession(id).subscribe({
      next: () => {
        this.flash = this.revokeFlash(id);
        this.reloadSessions();
        this.reloadDevices();
      },
      error: () => (this.error = 'Couldn’t end that login.'),
    });
  }

  private revokeFlash(id: string): string {
    const s = this.sessions.find((row) => row.id === id);
    if (!s) return 'Login ended.';
    const copy = sessionRevokeCopy(s);
    return `${copy.consequence} ${copy.after}`;
  }

  onExperienceChange() {
    if (!this.draft) return;
    this.permissionOptions = permissionsForExperience(this.draft.role, this.experienceTypeId);
    this.draft.permissions = defaultPermissionsForRole(this.draft.role);
  }

  hasPerm(id: string): boolean {
    return !!this.draft?.permissions.includes(id);
  }

  togglePerm(id: string, event: Event) {
    if (!this.draft) return;
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.draft.permissions.includes(id)) this.draft.permissions = [...this.draft.permissions, id];
    } else {
      this.draft.permissions = this.draft.permissions.filter((p) => p !== id);
    }
  }

  cancel() {
    this.draft = null;
    this.selected = null;
  }

  save() {
    if (!this.draft) return;
    if (!this.draft.displayName.trim()) {
      this.error = 'Name is required.';
      return;
    }
    this.busy = true;
    this.error = '';
    this.flash = '';

    if (this.draft.id) {
      const body: { displayName: string; role: string; permissions: string[]; pin?: string } = {
        displayName: this.draft.displayName.trim(),
        role: this.draft.role,
        permissions: this.draft.permissions,
      };
      if (this.draft.pin.trim().length >= 4) body.pin = this.draft.pin.trim();
      this.api.updateOperateStaff(this.draft.id, body).subscribe({
        next: () => {
          this.busy = false;
          this.flash = 'Saved.';
          this.draft = null;
          this.reload();
        },
        error: () => {
          this.busy = false;
          this.error = 'Couldn’t save — try again.';
        },
      });
      return;
    }

    if (!this.draft.email.trim() || this.draft.pin.trim().length < 4) {
      this.busy = false;
      this.error = 'Email and PIN (4+) required for new staff.';
      return;
    }

    this.api
      .createOperateStaff({
        ...(this.draft.organisationId ? { organisationId: this.draft.organisationId } : {}),
        displayName: this.draft.displayName.trim(),
        email: this.draft.email.trim().toLowerCase(),
        pin: this.draft.pin.trim(),
        role: this.draft.role,
        permissions: this.draft.permissions,
      })
      .subscribe({
        next: () => {
          this.busy = false;
          this.flash = 'Staff created.';
          this.draft = null;
          this.reload();
        },
        error: () => {
          this.busy = false;
          this.error = 'Couldn’t create — email may already exist.';
        },
      });
  }

  private reload() {
    this.loading = true;
    this.api.listOperateStaff().subscribe({
      next: (rows) => {
        this.members = rows.map((r) => ({
          ...r,
          permissions: r.permissions ?? [],
        }));
        this.loading = false;
        this.reloadDevices();
        this.reloadSessions();
      },
      error: () => {
        this.loading = false;
        this.error = 'Couldn’t load team — is the API running?';
      },
    });
  }

  private reloadDevices() {
    this.api.listStaffDevices(this.members[0]?.organisationId).subscribe({
      next: (rows) => (this.devices = rows),
      error: () => (this.error = 'Couldn’t load devices.'),
    });
  }

  private reloadSessions() {
    this.api.listStaffSessions({ organisationId: this.members[0]?.organisationId }).subscribe({
      next: (rows) => (this.sessions = rows),
      error: () => (this.error = 'Couldn’t load sessions.'),
    });
  }
}
