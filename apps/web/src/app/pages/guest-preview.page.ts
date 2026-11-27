import {
  Component,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GuestPageComponent } from './guest.page';
import { LeosApiService, SessionStateService } from '../services/leos-api.service';
import {
  PREVIEW_ME,
  PREVIEW_SECRET,
  PREVIEW_SESSION_ID,
  buildPreviewTable,
  pay,
  type PreviewMenuItem,
  type PreviewVenue,
} from '../preview/preview-table';
import { currentPreviewTable, setPreviewTable } from '../preview/preview-store';
import { PREVIEW_SHARED_KEYS } from '../preview/preview-storage';
import {
  GUEST_STATE_CHANGED,
  decodePreviewSnapshot,
  isPreviewMessage,
  normalisePreviewScreen,
  type PreviewScreen,
  type PreviewVenueSnapshot,
} from '../preview/preview-protocol';

/**
 * Studio's preview phone — the real guest app on a sample table.
 *
 * /preview?venue=<id>&screen=<arrive|menu|bill|pay|help|done>&table=<code>
 * Studio sends the venue as it is being edited, a screen to show, and "refresh"
 * after a save. Nothing the guest does here reaches the kitchen, till or a gateway.
 */
@Component({
  standalone: true,
  selector: 'leos-guest-preview-page',
  template: `
    <p class="guest-preview__note" role="note">Preview — nothing is sent</p>
    @if (missing) {
      <p class="guest-preview__missing">{{ missing }}</p>
    }
    <ng-container #host />
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .guest-preview__note {
        margin: 0;
        padding: 0.3rem 1rem;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        text-align: center;
        color: #334155;
        background: #f3f1ed;
      }
      .guest-preview__missing {
        margin: 2rem 1.25rem;
        font-size: 0.95rem;
        line-height: 1.45;
        color: #475569;
        text-align: center;
      }
    `,
  ],
})
export class GuestPreviewPageComponent implements OnInit, OnDestroy {
  @ViewChild('host', { read: ViewContainerRef, static: true }) private host!: ViewContainerRef;

  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(LeosApiService);
  private readonly state = inject(SessionStateService);

  private guestRef?: ComponentRef<GuestPageComponent>;
  private venueId = '';
  private placeCode = '';
  private screen: PreviewScreen = 'arrive';
  private menu: PreviewMenuItem[] = [];
  private venue: PreviewVenue | null = null;
  private pendingSnapshot: PreviewVenueSnapshot | null = null;
  missing = '';

  private readonly onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (!isPreviewMessage(event.data)) return;
    const msg = event.data;
    if (msg.venue) this.applySnapshot(msg.venue);
    if (msg.refresh) {
      this.load();
      return;
    }
    if (msg.screen) this.show(normalisePreviewScreen(msg.screen));
  };

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    this.venueId = (q.get('venue') || '').trim();
    this.placeCode = (q.get('table') || '').trim();
    this.screen = normalisePreviewScreen(q.get('screen'));
    // "Open on my phone": the link carries what guests see; the phone isn't signed in.
    const fromLink = decodePreviewSnapshot(q.get('v'));
    if (fromLink) this.applySnapshot(fromLink);
    window.addEventListener('message', this.onMessage);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'lekki-preview-ready' }, window.location.origin);
    }
    this.load();
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.onMessage);
    this.guestRef?.destroy();
    setPreviewTable(null);
  }

  private load() {
    if (!this.venueId) {
      this.missing = 'Choose a place in Studio to see it here.';
      return;
    }
    forkJoin({
      workspace: this.api.getWorkspace(this.venueId).pipe(catchError(() => of(null))),
      catalogue: this.api.getCatalogue(this.venueId).pipe(catchError(() => of([]))),
    }).subscribe(({ workspace, catalogue }) => {
      this.menu = (catalogue ?? []).map((c) => ({
        id: c.id,
        label: c.label,
        unitPrice: Number(c.unitPrice) || 0,
        category: c.category,
        available: c.available,
        routingTags: c.routingTags,
      }));
      this.venue = {
        venueId: this.venueId,
        organisationId: workspace?.organisationId ?? this.venue?.organisationId ?? '',
        venueName: workspace?.venueName ?? this.venue?.venueName ?? '',
        brandColour: workspace?.brandColour || this.venue?.brandColour || '#d7a14a',
        logoUrl: workspace?.logoUrl ?? this.venue?.logoUrl ?? '',
        location: workspace?.location ?? this.venue?.location ?? '',
        guestDesign: workspace?.guestDesign ?? this.venue?.guestDesign ?? null,
        paymentsActive: workspace?.paymentsActive ?? this.venue?.paymentsActive ?? false,
        currency: workspace?.currency || this.venue?.currency || 'ZAR',
      };
      if (this.pendingSnapshot) this.mergeSnapshot(this.pendingSnapshot);
      this.missing = '';
      this.rebuild();
    });
  }

  /** Studio's live edits win over what was last saved. */
  private applySnapshot(snap: PreviewVenueSnapshot) {
    if (snap.placeCode) this.placeCode = snap.placeCode;
    if (!this.venue) {
      this.pendingSnapshot = { ...(this.pendingSnapshot ?? {}), ...snap };
      return;
    }
    this.mergeSnapshot(snap);
    const table = currentPreviewTable();
    if (table) {
      table.venue = this.venue;
      if (snap.placeCode) table.placeCode = snap.placeCode;
    }
    this.writeState();
    this.guestRef?.instance.session.refreshLive();
    this.guestRef?.changeDetectorRef.detectChanges();
  }

  private mergeSnapshot(snap: PreviewVenueSnapshot) {
    if (!this.venue) return;
    this.venue = {
      ...this.venue,
      ...(snap.venueName?.trim() ? { venueName: snap.venueName } : {}),
      ...(snap.brandColour ? { brandColour: snap.brandColour } : {}),
      ...(snap.logoUrl !== undefined ? { logoUrl: snap.logoUrl } : {}),
      ...(snap.location !== undefined ? { location: snap.location } : {}),
      ...(snap.guestDesign !== undefined ? { guestDesign: snap.guestDesign } : {}),
      ...(snap.paymentsActive !== undefined ? { paymentsActive: snap.paymentsActive } : {}),
    };
    this.pendingSnapshot = null;
  }

  private writeState() {
    const v = this.venue;
    if (!v) return;
    const s = this.state;
    s.sessionId = PREVIEW_SESSION_ID;
    s.participantId = PREVIEW_ME;
    s.participantSecret = PREVIEW_SECRET;
    s.displayName = 'You';
    s.organisationId = v.organisationId;
    s.venueId = v.venueId;
    s.venueName = v.venueName;
    s.brandColour = v.brandColour;
    s.logoUrl = v.logoUrl;
    s.location = v.location;
    s.guestDesign = v.guestDesign;
    s.paymentsActive = v.paymentsActive;
    s.currency = v.currency;
    s.physicalContextCode = currentPreviewTable()?.placeCode ?? this.placeCode;
    s.persist();
    window.dispatchEvent(new Event(GUEST_STATE_CHANGED));
  }

  /** Fresh sample table and a fresh guest app — used on load, refresh and "Arrive". */
  private rebuild() {
    if (!this.venue) return;
    setPreviewTable(
      buildPreviewTable({ venue: this.venue, menu: this.menu, placeCode: this.placeCode }),
    );
    this.resetGuestStorage();
    this.writeState();
    this.guestRef?.destroy();
    this.host.clear();
    this.guestRef = this.host.createComponent(GuestPageComponent);
    this.guestRef.changeDetectorRef.detectChanges();
    this.showWhenSettled(this.screen);
  }

  /** The guest app picks its own first screen once the menu loads — move it after that. */
  private showWhenSettled(screen: PreviewScreen, waited = 0) {
    const session = this.guestRef?.instance.session;
    if (!session) return;
    if (session.catalogueLoading && waited < 4000) {
      setTimeout(() => this.showWhenSettled(screen, waited + 100), 100);
      return;
    }
    setTimeout(() => this.show(screen, true), 60);
  }

  /** Forget greetings and carts so "Arrive" looks like a first scan. Sign-in stays. */
  private resetGuestStorage() {
    for (const store of [localStorage, sessionStorage]) {
      const keep = new Map<string, string>();
      for (const k of PREVIEW_SHARED_KEYS) {
        const v = store.getItem(k);
        if (v != null) keep.set(k, v);
      }
      store.clear();
      for (const [k, v] of keep) store.setItem(k, v);
    }
  }

  private show(screen: PreviewScreen, fromRebuild = false) {
    this.screen = screen;
    const guest = this.guestRef?.instance;
    if (!guest) return;
    const session = guest.session;
    if (screen === 'arrive') {
      if (!fromRebuild) this.rebuild();
      return;
    }
    session.helpSheetOpen = false;
    if (screen === 'menu') session.onTabSelect('menu');
    else if (screen === 'bill') session.onTabSelect('orders');
    else if (screen === 'pay') session.openBill();
    else if (screen === 'help') {
      session.onTabSelect('orders');
      session.openHelpSheet();
    } else if (screen === 'done') {
      const table = currentPreviewTable();
      if (table && table.transactions.some((t) => t.status !== 'settled')) {
        pay(table, { scope: 'visit', tipPercent: 10 });
      }
      session.refreshLive();
      session.phase = 'receipt';
    }
    this.guestRef?.changeDetectorRef.detectChanges();
  }
}
