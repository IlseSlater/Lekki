import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { resolveApiBaseUrl } from './public-origin';
import { OperateStaffSessionService } from './operate-staff-session.service';
import type { GuestExperienceDesign } from '../studio/guest-experience-design';
import { guestPreviewActive } from '../preview/preview-storage';

/** Kitchen pace as a manager sets it (menu hours, pause, busy minutes, hold-and-fire). */
export interface KitchenPaceSettings {
  paused: boolean;
  /** When a pause ends by itself (ISO). Null = until reopened. */
  pausedUntil?: string | null;
  pauseReason?: string;
  holdRounds: boolean;
  categoryHours: Record<string, { from: string; to: string }>;
  busyMinutes: Record<string, number>;
  /** When busy minutes stop applying (ISO). */
  busyUntil?: string | null;
  /** Days the venue is closed ("YYYY-MM-DD"). */
  closedDates?: Array<{ date: string; note: string }>;
  /** Item id → the day it is sold out for. */
  soldOutToday?: Record<string, string>;
  /** Read-only: today is a closed day. */
  closedToday?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LeosApiService {
  private socket?: Socket;
  private socketOrgId = '';
  private socketSessionId = '';
  private socketOperateRole = '';
  private socketParticipantSecret = '';
  /** Same host as the page when opened from a phone on LAN (Restaurant App pattern). */
  private readonly api = resolveApiBaseUrl();
  private readonly staffSession = inject(OperateStaffSessionService);

  constructor(private readonly http: HttpClient) {}

  private staffAuthHeaders(): HttpHeaders | undefined {
    const h = this.staffSession.authHeaders();
    if (!h['X-Staff-Token']) return undefined;
    return new HttpHeaders(h);
  }

  /** Guest participant secret or staff token — staff wins when both exist (Operate). */
  private sessionAuthHeaders(participantSecret?: string): HttpHeaders | undefined {
    const staff = this.staffAuthHeaders();
    if (staff) return staff;
    const secret = participantSecret?.trim();
    if (secret) return new HttpHeaders({ 'x-participant-secret': secret });
    return undefined;
  }

  resolveEntry(body: {
    token: string;
    displayName: string;
    identityId?: string;
    participantId?: string;
    participantSecret?: string;
  }) {
    return this.http.post<{
      context: {
        physicalContextCode?: string;
        physicalContextType?: string;
        venueId?: string;
        profile: { id?: string; label: string; terminology: Record<string, string> };
      };
      session: {
        id: string;
        organisationId: string;
        venueId: string;
        correlationId: string;
        profileId?: string;
        physicalContextId?: string;
      };
      venueName?: string | null;
      menuBrandEnabled?: boolean;
      brandColour?: string | null;
      logoUrl?: string | null;
      menuCoverUrl?: string | null;
      location?: string | null;
      guestDesign?: Record<string, unknown> | null;
      paymentsActive?: boolean;
      currency?: string;
      joinedParticipantId?: string | null;
      participantSecret?: string;
    }>(`${this.api}/entry/resolve`, body);
  }

  /** Studio Identity → Venue menu brand (Guest Continuity). Prefer patchWorkspace. */
  saveVenueBrand(body: {
    venueId: string;
    menuBrandEnabled: boolean;
    brandColour?: string;
    venueName?: string;
    logoUrl?: string;
    menuCoverUrl?: string;
    location?: string;
    guestDesignJson?: Record<string, unknown>;
  }) {
    return this.http.put<{
      venueId?: string;
      venueName?: string;
      menuBrandEnabled: boolean;
      brandColour: string;
      logoUrl?: string;
      menuCoverUrl?: string;
      location?: string;
    }>(`${this.api}/setup/brand`, body, { headers: this.staffAuthHeaders() });
  }

  getWorkspace(venueId: string) {
    return this.http.get<{
      venueId: string;
      venueName: string;
      organisationId: string;
      brandColour: string;
      menuBrandEnabled: boolean;
      logoUrl: string;
      menuCoverUrl: string;
      location: string;
      guestDesign: Record<string, unknown> | null;
      timezone: string;
      currency: string;
      paymentsActive?: boolean;
    }>(`${this.api}/studio/workspace/${venueId}`, {
      headers: this.staffAuthHeaders(),
    });
  }

  patchWorkspace(
    venueId: string,
    body: {
      venueName?: string;
      brandColour?: string;
      menuBrandEnabled?: boolean;
      logoUrl?: string;
      menuCoverUrl?: string;
      location?: string;
      guestDesign?: Record<string, unknown>;
    },
  ) {
    return this.http.patch<{
      venueId: string;
      venueName: string;
      organisationId: string;
      brandColour: string;
      menuBrandEnabled: boolean;
      logoUrl: string;
      menuCoverUrl: string;
      location: string;
      guestDesign: Record<string, unknown> | null;
      timezone: string;
      currency: string;
      paymentsActive?: boolean;
    }>(`${this.api}/studio/workspace/${venueId}`, body, {
      headers: this.staffAuthHeaders(),
    });
  }

  uploadVenueAsset(venueId: string, kind: 'logo' | 'cover', file: File) {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('kind', kind);
    return this.http.post<{
      assetId: string;
      kind: string;
      url: string;
      byteSize: number;
      contentType: string;
    }>(`${this.api}/studio/venue/${venueId}/assets`, form, {
      headers: this.staffAuthHeaders(),
    });
  }

  mintEntryToken(body: {
    organisationId: string;
    venueId: string;
    physicalContextId: string;
    profileId: string;
    profileVersion: string;
  }) {
    return this.http.post<{ token: string }>(`${this.api}/setup/entry/mint`, body, {
      headers: this.staffAuthHeaders(),
    });
  }

  /** The owner says how many places. The backend creates each place and its QR. */
  ensurePlaces(codes: string[]) {
    return this.http.post<{
      venueId: string;
      places: Array<{ code: string; physicalContextId: string; token: string }>;
    }>(`${this.api}/setup/entry/places`, { codes }, { headers: this.staffAuthHeaders() });
  }

  resolveSetupEntryContext(placeCode?: string) {
    const params = placeCode ? `?placeCode=${encodeURIComponent(placeCode)}` : '';
    return this.http.get<{
      organisationId: string;
      venueId: string;
      physicalContextId: string;
      profileId: string;
      profileVersion: string;
      placeCode: string;
    }>(`${this.api}/setup/entry/context${params}`, { headers: this.staffAuthHeaders() });
  }

  getCatalogue(venueId: string) {
    return this.http.get<
      Array<{
        id: string;
        label: string;
        description?: string;
        imageUrl?: string;
        unitPrice: number;
        routingTags: string[];
        category: string;
        available?: boolean;
        /** When sold out: back 'tomorrow' by itself, or only when 'changed'. */
        soldOutUntil?: 'tomorrow' | 'changed' | null;
        allergens?: string[];
        dietaryTags?: string[];
        ageRestricted?: boolean;
        choiceGroups?: Array<{
          id: string;
          label: string;
          required: boolean;
          min?: number;
          max?: number;
          options: Array<{
            id: string;
            label: string;
            priceDelta?: number;
            imageUrl?: string;
          }>;
        }>;
      }>
    >(`${this.api}/catalogue/venue/${venueId}`);
  }

  createTransaction(body: {
    sessionId: string;
    participantId?: string;
    participantSecret: string;
    /** Same key on every retry of one order. */
    idempotencyKey?: string;
    lines: Array<{
      catalogueItemId: string;
      quantity: number;
      notes?: string;
      selectionsJson?: unknown;
    }>;
  }) {
    return this.http.post<{
      transactionId: string;
      fulfilments: Array<{ fulfilmentId: string; stationId: string; status: string }>;
    }>(`${this.api}/transactions`, body);
  }

  requestPayment(
    sessionId: string,
    body?: {
      tipAmount?: number;
      tipPercent?: number;
      scope?: 'visit' | 'mine' | 'equal' | 'amount';
      /** Major units. Used with scope 'amount'. */
      amount?: number;
      participantId?: string;
      participantSecret?: string;
      /** Same key on every retry of one payment attempt. */
      idempotencyKey?: string;
    },
  ) {
    return this.http.post<{
      paymentId: string;
      status: string;
      reference: string;
      checkout?: {
        method: 'form_post';
        actionUrl: string;
        fields: Record<string, string>;
      };
    }>(`${this.api}/payments/request/${sessionId}`, body ?? {});
  }

  /** Staff-only manual settlement — guests must never call this. */
  completePayment(paymentId: string) {
    return this.http.post(
      `${this.api}/payments/${paymentId}/complete`,
      {},
      { headers: this.staffAuthHeaders() },
    );
  }

  leaveSession(sessionId: string, participantId: string, participantSecret: string) {
    return this.http.post<{ closed: boolean }>(`${this.api}/sessions/${sessionId}/leave`, {
      participantId,
      participantSecret,
    });
  }

  createCatalogueItem(
    venueId: string,
    body: {
      label: string;
      unitPrice: number;
      category: string;
      description?: string;
      available?: boolean;
      routingTags?: string[];
      imageUrl?: string;
      allergens?: string[];
      dietaryTags?: string[];
      ageRestricted?: boolean;
    },
  ) {
    return this.http.post(`${this.api}/catalogue/venue/${venueId}`, body, {
      headers: this.staffAuthHeaders(),
    });
  }

  /** Empty menu → short priced starter. A venue with any dish is left alone. */
  seedStarterMenu(venueId: string, typeId?: string) {
    return this.http.post<{ seeded: number }>(
      `${this.api}/catalogue/venue/${venueId}/starter`,
      { typeId },
      { headers: this.staffAuthHeaders() },
    );
  }

  updateCatalogueItem(
    id: string,
    body: {
      label?: string;
      description?: string;
      unitPrice?: number;
      category?: string;
      available?: boolean;
      routingTags?: string[];
      imageUrl?: string;
      allergens?: string[];
      dietaryTags?: string[];
      ageRestricted?: boolean;
    },
  ) {
    return this.http.put(`${this.api}/catalogue/item/${id}`, body, {
      headers: this.staffAuthHeaders(),
    });
  }

  closeSession(sessionId: string, opts?: { asOwner?: boolean }) {
    // Studio owner force-clear must not send a leftover staff token (session.close required if present).
    const headers = opts?.asOwner ? undefined : this.staffAuthHeaders();
    return this.http.post(`${this.api}/sessions/${sessionId}/close`, {}, { headers });
  }

  /** Claim-from-table — re-stamp open lines to this guest. */
  claimLines(
    sessionId: string,
    body: { participantId: string | null; lineIds: string[]; participantSecret: string },
  ) {
    return this.http.post<{
      ok: boolean;
      claimed: number;
      lineIds: string[];
      undo: Array<{ lineId: string; previousParticipantId: string | null }>;
    }>(`${this.api}/sessions/${sessionId}/claim-lines`, body);
  }

  /** After the meal: tell the manager privately. */
  leaveGuestNote(
    sessionId: string,
    body: { participantId: string; participantSecret: string; note: string },
  ) {
    return this.http.post<{ ok: boolean }>(`${this.api}/feedback/sessions/${sessionId}/note`, body);
  }

  /** Studio: one calm sentence about tonight. Null while the averages are not real yet. */
  eveningSentence() {
    return this.http.get<{ sentence: string | null }>(`${this.api}/operate/evening`, {
      headers: this.staffAuthHeaders(),
    });
  }

  /** Studio: what guests told the manager privately. */
  listGuestNotes() {
    return this.http.get<Array<{ id: string; placeCode: string | null; body: string; createdAt: string }>>(
      `${this.api}/feedback/notes`,
      { headers: this.staffAuthHeaders() },
    );
  }

  /** One dish, shared: join or leave the share of a line. */
  shareLine(
    sessionId: string,
    body: { lineId: string; action: 'join' | 'leave'; participantSecret: string },
  ) {
    return this.http.post<{ ok: boolean; lineId: string; sharedWith: string[] }>(
      `${this.api}/sessions/${sessionId}/share-line`,
      body,
    );
  }

  getSession(sessionId: string, participantSecret?: string) {
    return this.http.get<{
      id: string;
      status: string;
      correlationId: string;
      placeCode?: string | null;
      venueName?: string | null;
      menuBrandEnabled?: boolean;
      brandColour?: string | null;
      logoUrl?: string | null;
      menuCoverUrl?: string | null;
      location?: string | null;
      guestDesign?: Record<string, unknown> | null;
      paymentsActive?: boolean;
      pace?: {
        paused: boolean;
        holdRounds: boolean;
        hiddenCategories: string[];
        busyNotes: string[];
      };
      participants?: Array<{
        id: string;
        displayName?: string;
        identityId?: string | null;
        role?: string;
      }>;
      fulfilments?: Array<{
        id: string;
        status: string;
        stationId: string;
        lines: Array<{ label?: string; quantity: number; transactionLineId?: string }>;
      }>;
      transactions?: Array<{
        id: string;
        total: number;
        status?: string;
        createdAt?: string;
        lines: Array<{
          id: string;
          label: string;
          quantity: number;
          unitPrice: number;
          catalogueItemId?: string | null;
          selectionsJson?: unknown;
          participantId?: string | null;
          sharedWith?: string[];
        }>;
      }>;
      payments?: Array<{
        id: string;
        status: string;
        amount: number;
        tipAmount?: number;
        scope?: string;
        participantId?: string | null;
      }>;
    }>(`${this.api}/sessions/${sessionId}`, {
      headers: this.sessionAuthHeaders(participantSecret),
    });
  }

  listFulfilments(stationId: string) {
    return this.http.get<
      Array<{
        id: string;
        status: string;
        stationId: string;
        sessionId?: string;
        placeCode?: string | null;
        createdAt?: string;
        transaction: { id: string };
        lines: Array<{ label?: string; quantity: number }>;
      }>
    >(`${this.api}/fulfilments/station/${stationId}`);
  }

  updateFulfilmentStatus(id: string, status: string) {
    const headers = this.staffAuthHeaders();
    return this.http.patch(`${this.api}/fulfilments/${id}/status`, { status }, { headers });
  }

  requestAssistance(body: {
    sessionId: string;
    kind?: 'service' | 'manager';
    message?: string;
  }) {
    return this.http.post<{
      id: string;
      kind: string;
      status: string;
      sessionId: string;
      message?: string;
    }>(`${this.api}/assistance`, body);
  }

  listAssistance(opts?: { sessionId?: string; kind?: 'service' | 'manager' }) {
    const params: Record<string, string> = {};
    if (opts?.sessionId) params['sessionId'] = opts.sessionId;
    if (opts?.kind) params['kind'] = opts.kind;
    return this.http.get<
      Array<{
        id: string;
        kind: string;
        message?: string;
        status: string;
        sessionId?: string;
        createdAt?: string;
      }>
    >(`${this.api}/assistance`, { params });
  }

  acknowledgeAssistance(id: string, opts?: { asOwner?: boolean }) {
    const headers = opts?.asOwner ? undefined : this.staffAuthHeaders();
    return this.http.post(`${this.api}/assistance/${id}/acknowledge`, {}, { headers });
  }

  resolveAssistance(id: string, opts?: { asOwner?: boolean }) {
    const headers = opts?.asOwner ? undefined : this.staffAuthHeaders();
    return this.http.post(`${this.api}/assistance/${id}/resolve`, {}, { headers });
  }

  listOperateStaff(organisationId?: string) {
    return this.http.get<
      Array<{
        id: string;
        displayName: string;
        email: string;
        role: string;
        organisationId: string;
        permissions: string[];
        homePath: string;
      }>
    >(`${this.api}/identity/staff`, {
      params: organisationId ? { organisationId } : {},
    });
  }

  createOperateStaff(body: {
    organisationId?: string;
    displayName: string;
    email: string;
    pin: string;
    role: string;
    permissions?: string[];
  }) {
    return this.http.post<{
      id: string;
      displayName: string;
      email: string;
      role: string;
      organisationId: string;
      permissions: string[];
      homePath: string;
    }>(`${this.api}/identity/staff`, body);
  }

  updateOperateStaff(
    id: string,
    body: {
      displayName?: string;
      role?: string;
      permissions?: string[];
      pin?: string;
    },
  ) {
    return this.http.patch<{
      id: string;
      displayName: string;
      email: string;
      role: string;
      organisationId: string;
      permissions: string[];
      homePath: string;
    }>(`${this.api}/identity/staff/${id}`, body);
  }

  staffLogin(body: { email: string; password: string; deviceLabel?: string }) {
    return this.http.post<{
      id: string;
      organisationId: string;
      displayName: string;
      email: string;
      role: string;
      permissions: string[];
      homePath: string;
      token: string;
      sessionId: string;
    }>(`${this.api}/identity/staff/login`, body);
  }

  googleOauthConfig() {
    return this.http.get<{ enabled: boolean; clientId: string | null }>(`${this.api}/identity/oauth/google`);
  }

  googleStaffLogin(body: { accessToken?: string; credential?: string; deviceLabel?: string }) {
    return this.http.post<{
      id: string;
      organisationId: string;
      displayName: string;
      email: string;
      role: string;
      permissions: string[];
      homePath: string;
      token: string;
      sessionId: string;
    }>(`${this.api}/identity/staff/oauth/google`, body);
  }

  staffLogout(body: { sessionId?: string; token?: string }) {
    return this.http.post<{ ok: boolean }>(`${this.api}/identity/staff/logout`, body);
  }

  listStaffDevices(organisationId?: string) {
    return this.http.get<
      Array<{
        id: string;
        organisationId: string;
        label: string;
        lastStaffId?: string | null;
        lastStaffName?: string | null;
        lastSeenAt: string;
        inUse?: boolean;
      }>
    >(`${this.api}/identity/staff/devices`, {
      params: organisationId ? { organisationId } : {},
    });
  }

  createStaffDevice(body: { organisationId?: string; label: string }) {
    return this.http.post<{ id: string; label: string }>(`${this.api}/identity/staff/devices`, body);
  }

  listStaffSessions(params?: { organisationId?: string; active?: boolean }) {
    return this.http.get<
      Array<{
        id: string;
        staffId: string;
        displayName: string;
        email: string;
        role: string;
        organisationId: string;
        deviceLabel?: string | null;
        createdAt: string;
        lastSeenAt: string;
        revokedAt?: string | null;
        active: boolean;
      }>
    >(`${this.api}/identity/staff/sessions`, {
      params: {
        ...(params?.organisationId ? { organisationId: params.organisationId } : {}),
        ...(params?.active ? { active: '1' } : {}),
      },
    });
  }

  revokeStaffSession(id: string) {
    return this.http.post<{ ok: boolean }>(`${this.api}/identity/staff/sessions/${id}/revoke`, {});
  }

  /** Staff Operate — key a bill line (origin staff_operate) before Pilot sync exists. */
  addStaffBillLine(
    sessionId: string,
    body: { label: string; unitPrice: number; quantity?: number },
  ) {
    return this.http.post<{ transactionId: string }>(
      `${this.api}/operate/sessions/${sessionId}/bill-lines`,
      body,
      { headers: this.staffAuthHeaders() },
    );
  }

  /** "I've got this table." */
  takeTable(sessionId: string) {
    return this.http.post<{ id: string; waiterId: string | null; waiterName: string | null }>(
      `${this.api}/operate/sessions/${sessionId}/take`,
      {},
      { headers: this.staffAuthHeaders() },
    );
  }

  /** One venue's kitchen pace. Without a venue, the organisation's first venue. */
  getPace(venueId?: string | null) {
    return this.http.get<KitchenPaceSettings>(`${this.api}/operate/pace`, {
      headers: this.staffAuthHeaders(),
      params: venueId ? { venueId } : {},
    });
  }

  savePace(pace: KitchenPaceSettings, venueId?: string | null) {
    return this.http.put<KitchenPaceSettings>(`${this.api}/operate/pace`, pace, {
      headers: this.staffAuthHeaders(),
      params: venueId ? { venueId } : {},
    });
  }

  /**
   * Pause or resume new orders — for a set number of minutes (or until reopened) with a reason.
   * Seated guests can still see and pay. Managers are told.
   */
  pauseOrders(
    paused: boolean,
    opts?: { minutes?: number | null; reason?: string; venueId?: string | null },
  ) {
    return this.http.post<KitchenPaceSettings>(
      `${this.api}/operate/pace/pause`,
      {
        paused,
        minutes: opts?.minutes ?? null,
        reason: opts?.reason ?? '',
        ...(opts?.venueId ? { venueId: opts.venueId } : {}),
      },
      { headers: this.staffAuthHeaders() },
    );
  }

  /** Sold out for today (back tomorrow by itself), until changed, or back on now. */
  setItemAvailability(itemId: string, mode: 'today' | 'until_changed' | 'back') {
    return this.http.post<{ venueId: string; available: boolean }>(
      `${this.api}/operate/items/${encodeURIComponent(itemId)}/availability`,
      { mode },
      { headers: this.staffAuthHeaders() },
    );
  }

  /** A waiter records what the venue's own card machine took (empty amount = everything left). */
  recordCardMachinePayment(
    sessionId: string,
    body: { amount?: number | null; tipAmount?: number | null },
  ) {
    return this.http.post<{ paymentId: string; status: string; paidMinor: number; tipMinor: number }>(
      `${this.api}/operate/sessions/${sessionId}/card-machine`,
      {
        amount: body.amount === null || body.amount === undefined || (body.amount as unknown) === '' ? null : Number(body.amount),
        tipAmount: body.tipAmount === null || body.tipAmount === undefined || (body.tipAmount as unknown) === '' ? null : Number(body.tipAmount),
      },
      { headers: this.staffAuthHeaders() },
    );
  }

  /** Today's payments: table, bill, paid, full or part, still owed. */
  paymentFeed() {
    return this.http.get<
      Array<{
        paymentId: string;
        at: string;
        placeCode: string | null;
        billMinor: number;
        paidMinor: number;
        tipMinor: number;
        kind: 'full' | 'part';
        leftMinor: number;
        settled: boolean;
      }>
    >(`${this.api}/operate/payments`, { headers: this.staffAuthHeaders() });
  }

  /** Push one order back by 5, 10, 20 or 30 minutes — once. */
  delayFulfilment(id: string, minutes: number) {
    return this.http.post<{ fulfilmentId: string; delayedMinutes: number }>(
      `${this.api}/fulfilments/${id}/delay`,
      { minutes },
      { headers: this.staffAuthHeaders() },
    );
  }

  /** Cancel an order. A reason is required; "Other" needs a note. */
  cancelFulfilment(id: string, reason: string, note?: string) {
    return this.http.patch(
      `${this.api}/fulfilments/${id}/status`,
      { status: 'cancelled', reason, note: note ?? '' },
      { headers: this.staffAuthHeaders() },
    );
  }

  /** Every step of one order with its time and who did it. */
  fulfilmentTimeline(id: string) {
    return this.http.get<Array<{ at: string; step: string; by: string | null; detail: string | null }>>(
      `${this.api}/fulfilments/${id}/timeline`,
      { headers: this.staffAuthHeaders() },
    );
  }

  /** Fire a held round: every ticket for the table goes to its station together. */
  fireRound(sessionId: string) {
    return this.http.post<{ fired: number }>(
      `${this.api}/operate/sessions/${sessionId}/fire`,
      {},
      { headers: this.staffAuthHeaders() },
    );
  }

  /** My tips this shift (waiter phone). */
  myTips() {
    return this.http.get<{ since: string; tipMinor: number; count: number }>(
      `${this.api}/operate/tips/mine`,
      { headers: this.staffAuthHeaders() },
    );
  }

  /** Tips this shift per waiter (Team, manager only). */
  staffTips() {
    return this.http.get<{
      since: string;
      waiters: Array<{ waiterId: string; name: string; tipMinor: number; count: number }>;
    }>(`${this.api}/identity/staff/tips`, { headers: this.staffAuthHeaders() });
  }

  /** A manager moves an open bill to another table. */
  moveTable(sessionId: string, toCode: string) {
    return this.http.post<{ sessionId: string; placeCode: string; fromCode: string }>(
      `${this.api}/operate/sessions/${sessionId}/move`,
      { toCode },
      { headers: this.staffAuthHeaders() },
    );
  }

  getPushKey() {
    return this.http.get<{ publicKey: string | null }>(`${this.api}/push/key`);
  }

  subscribePush(subscription: PushSubscriptionJSON) {
    return this.http.post<{ ok: true }>(
      `${this.api}/push/subscribe`,
      { subscription },
      { headers: this.staffAuthHeaders() },
    );
  }

  listFloorTables(params?: { venueId?: string; organisationId?: string }) {
    return this.http.get<{
      tables: Array<{
        sessionId: string;
        placeCode: string;
        placeType: string;
        contextId: string;
        venueId: string;
        status: string;
        startedAt: string;
        idleMinutes: number;
        orderCount: number;
        fulfilmentCount: number;
        readyCount: number;
        preparingCount?: number;
        pendingCount?: number;
        heldCount?: number;
        helpCount: number;
        helpKinds: string[];
        waiterId?: string | null;
        waiterName?: string | null;
        items?: Array<{
          fulfilmentId: string;
          status: string;
          stationId: string;
          label: string;
          quantity: number;
        }>;
      }>;
    }>(`${this.api}/operate/floor`, {
      headers: this.staffAuthHeaders(),
      params: {
        ...(params?.venueId ? { venueId: params.venueId } : {}),
      },
    });
  }

  listPaymentProviders() {
    return this.http.get<
      Array<{
        id: string;
        connectorId: string;
        name: string;
        publisher: string;
        version: string;
        countries: string[];
        capabilities: string[];
        permissions: Array<{ id: string; reason: string }>;
        requirements: string[];
        installable: boolean;
        verified: boolean;
        description: string;
        installed?: boolean;
      }>
    >(`${this.api}/setup/payments/providers`);
  }

  getPaymentInstall() {
    return this.http.get<{
      id: string;
      connectorId: string;
      status: string;
      environment: string;
      merchantId: string | null;
      merchantKeyMasked: string | null;
      passphraseSet: boolean;
      businessName: string | null;
      merchantStatus: string | null;
      country: string | null;
      currency: string | null;
      settlement: Record<string, unknown> | null;
      routingStrategy: string | null;
      step: string | null;
    } | null>(`${this.api}/setup/payments/install`, { headers: this.staffAuthHeaders() });
  }

  testPaymentConnection(body: {
    connectorId: string;
    environment?: 'sandbox' | 'production';
    merchantId?: string;
    merchantKey?: string;
    passphrase?: string;
  }) {
    return this.http.post<{
      connected: boolean;
      businessName: string;
      merchantId: string;
      merchantStatus: string;
      country: string;
      currency: string;
      environment: string;
    }>(`${this.api}/setup/payments/test-connection`, body, { headers: this.staffAuthHeaders() });
  }

  savePaymentDraft(body: Record<string, unknown>) {
    return this.http.put(`${this.api}/setup/payments/draft`, body, {
      headers: this.staffAuthHeaders(),
    });
  }

  activatePaymentConnector() {
    return this.http.post<{
      ok: boolean;
      connectorId: string;
      activeConnectorId: string;
    }>(`${this.api}/setup/payments/activate`, {}, { headers: this.staffAuthHeaders() });
  }

  /** Studio POS — Pilot install status for venue. */
  getPosInstall(venueId: string) {
    return this.http.get<{
      status: string;
      connectorId: string;
      settlementOwner: 'lekki' | 'pos' | string;
      posOwnership: string;
      apiKeySet: boolean;
      webhookSecretSet: boolean;
      webhookNotifyPath: string;
    }>(`${this.api}/studio/pos/venue/${venueId}/install`, {
      headers: this.staffAuthHeaders(),
    });
  }

  activatePosPilot(
    venueId: string,
    body: {
      apiKey?: string;
      settlementOwner?: 'lekki' | 'pos';
      posOwnership?: string;
    },
  ) {
    return this.http.post<{
      status: string;
      settlementOwner: string;
      posOwnership: string;
      webhookSecret: string;
      webhookNotifyPath: string;
      message: string;
    }>(`${this.api}/studio/pos/venue/${venueId}/activate`, body, {
      headers: this.staffAuthHeaders(),
    });
  }

  getPosPlaceWorkspace(venueId: string) {
    return this.http.get<{
      rows: Array<{
        physicalContextId: string;
        label: string;
        type: string;
        mappingId: string | null;
        externalPlaceId: string;
      }>;
    }>(`${this.api}/studio/pos/venue/${venueId}/place-workspace`, {
      headers: this.staffAuthHeaders(),
    });
  }

  getPosSkuWorkspace(venueId: string) {
    return this.http.get<{
      rows: Array<{
        catalogueItemId: string;
        label: string;
        category: string;
        unitPrice: number;
        mappingId: string | null;
        externalSkuId: string;
      }>;
    }>(`${this.api}/studio/pos/venue/${venueId}/sku-workspace`, {
      headers: this.staffAuthHeaders(),
    });
  }

  upsertPosPlace(
    venueId: string,
    body: { physicalContextId: string; externalPlaceId: string },
  ) {
    return this.http.put<{ id: string; externalPlaceId: string }>(
      `${this.api}/studio/pos/venue/${venueId}/places`,
      body,
      { headers: this.staffAuthHeaders() },
    );
  }

  deletePosPlace(venueId: string, mappingId: string) {
    return this.http.delete(
      `${this.api}/studio/pos/venue/${venueId}/places/${mappingId}`,
      { headers: this.staffAuthHeaders() },
    );
  }

  upsertPosSku(
    venueId: string,
    body: { catalogueItemId: string; externalSkuId: string },
  ) {
    return this.http.put<{ id: string; externalSkuId: string }>(
      `${this.api}/studio/pos/venue/${venueId}/skus`,
      body,
      { headers: this.staffAuthHeaders() },
    );
  }

  deletePosSku(venueId: string, mappingId: string) {
    return this.http.delete(
      `${this.api}/studio/pos/venue/${venueId}/skus/${mappingId}`,
      { headers: this.staffAuthHeaders() },
    );
  }

  /** Grow Org Memory — yesterday / wait / calm trading breath. */
  getGrowOverview(token?: string) {
    return this.http.get<{
      venueName: string | null;
      venueId: string | null;
      guestsYesterday: number;
      guestsToday: number;
      waitToday?: number | null;
      waitYesterday?: number | null;
      averageWaitMinutes: number | null;
      paymentsStatus: 'healthy' | 'setup';
      hasMemory: boolean;
      takingsToday?: number;
      takingsYesterday?: number;
      currency?: string;
      popularLabel?: string | null;
    }>(`${this.api}/grow/overview`, {
      params: token ? { token } : {},
    });
  }

  connectSocket(organisationId: string, sessionId: string) {
    this.socketOrgId = organisationId;
    this.socketSessionId = sessionId;
    this.ensureIoConnected();
    this.rejoinRooms();
    return this.socket;
  }

  /**
   * Operate boards — join kitchen / bar / waiter / staff rooms
   * (Restaurant App kitchen · bar · waiters).
   */
  ensureOperateSocket(organisationId: string, operateRole: string) {
    if (!organisationId || !operateRole) return undefined;
    this.socketOrgId = organisationId;
    this.socketOperateRole = operateRole;
    this.ensureIoConnected();
    this.rejoinRooms();
    return this.socket;
  }

  /** Ensure session room is joined (Entry may already have connected). */
  ensureSocket(organisationId: string, sessionId: string, participantSecret?: string) {
    if (!organisationId || !sessionId) return undefined;
    this.socketOrgId = organisationId;
    this.socketSessionId = sessionId;
    if (participantSecret?.trim()) this.socketParticipantSecret = participantSecret.trim();
    this.ensureIoConnected();
    this.rejoinRooms();
    return this.socket;
  }

  private staffTokenForOperate(): string | undefined {
    if (typeof window !== 'undefined' && /(?:\?|&)monitor=1(?:&|$)/.test(window.location.search)) {
      return undefined;
    }
    return this.staffSession.token() || undefined;
  }

  private ensureIoConnected() {
    if (this.socket) return;
    // Studio's preview phone talks to a sample table — never a live room.
    if (guestPreviewActive()) return;
    const staffToken = this.staffTokenForOperate();
    this.socket = io(this.api, {
      query: {
        ...(this.socketOrgId ? { organisationId: this.socketOrgId } : {}),
        ...(this.socketSessionId ? { sessionId: this.socketSessionId } : {}),
        ...(this.socketOperateRole ? { operateRole: this.socketOperateRole } : {}),
        ...(staffToken ? { staffToken } : {}),
      },
    });
    this.socket.on('connect', () => this.rejoinRooms());
  }

  private rejoinRooms() {
    if (!this.socket?.connected || !this.socketOrgId) return;
    const staffToken = this.staffTokenForOperate();
    if (this.socketSessionId) {
      this.socket.emit('join', {
        organisationId: this.socketOrgId,
        sessionId: this.socketSessionId,
        ...(this.socketParticipantSecret
          ? { participantSecret: this.socketParticipantSecret }
          : {}),
      });
    }
    if (this.socketOperateRole) {
      this.socket.emit('join', {
        organisationId: this.socketOrgId,
        operateRole: this.socketOperateRole,
        ...(staffToken ? { staffToken } : {}),
      });
    }
  }

  /**
   * Live platform events (session and/or operate rooms).
   * Returns an unsubscribe function.
   */
  onPlatformEvent(handler: (envelope: PlatformEventEnvelope) => void): () => void {
    if (!this.socket) return () => undefined;
    const socket = this.socket;
    const listener = (envelope: PlatformEventEnvelope) => handler(envelope);
    socket.on('platform.event', listener);
    return () => {
      socket.off('platform.event', listener);
    };
  }

  isSocketConnected(): boolean {
    return !!this.socket?.connected;
  }
}

export type PlatformEventEnvelope = {
  eventName: string;
  organisationId?: string;
  payload?: Record<string, unknown>;
};

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  sessionId = '';
  organisationId = '';
  venueId = '';
  displayName = '';
  token = 'qr-demo-restaurant';
  events: string[] = [];
  terminology: Record<string, string> = {};
  profileLabel = '';
  profileId = '';
  /** Physical context code from Entry (e.g. T1, C1) — context-first UX. */
  physicalContextCode = '';
  /** Venue name for guest chrome (Arrival confidence). */
  venueName = '';
  /** Menu half-moon from Venue / Entry (Guest Continuity). */
  menuBrandEnabled = false;
  brandColour = '#d7a14a';
  logoUrl = '';
  menuCoverUrl = '';
  location = '';
  /** Continuity — this guest’s SessionParticipant id (mine vs visit). */
  participantId = '';
  /** Server-issued secret — resume this phone only, never by display name. */
  participantSecret = '';
  /** Venue guest experience design from entry resolve (not Studio localStorage). */
  guestDesign: Record<string, unknown> | null = null;
  /** Connector install is active for this venue — never grant Pay without it. */
  paymentsActive = false;
  currency = 'ZAR';

  persist() {
    localStorage.setItem('leos.session', JSON.stringify(this));
    if (this.guestDesign && typeof this.guestDesign === 'object') {
      localStorage.setItem('leos.guestDesign', JSON.stringify(this.guestDesign));
    } else {
      localStorage.removeItem('leos.guestDesign');
    }
  }

  /** Re-scan / splash — resume this device’s participant instead of minting a ghost. */
  entryBody(token: string, displayName: string) {
    return {
      token,
      displayName,
      participantId: this.participantId || undefined,
      participantSecret: this.participantSecret || undefined,
    };
  }

  restore() {
    const raw = localStorage.getItem('leos.session');
    if (!raw) return;
    try {
      Object.assign(this, JSON.parse(raw));
    } catch {
      this.clear();
      return;
    }
    // Purge legacy Base64 brand blobs — durable URLs only.
    if (this.logoUrl?.toLowerCase().startsWith('data:')) this.logoUrl = '';
    if (this.menuCoverUrl?.toLowerCase().startsWith('data:')) this.menuCoverUrl = '';
    const designRaw = localStorage.getItem('leos.guestDesign');
    if (designRaw) {
      try {
        this.guestDesign = JSON.parse(designRaw);
      } catch {
        this.guestDesign = null;
      }
    }
  }

  /** Wipe all in-memory + persisted session state so the user can start fresh. */
  clear() {
    this.sessionId = '';
    this.organisationId = '';
    this.venueId = '';
    this.displayName = '';
    this.events = [];
    this.terminology = {};
    this.profileLabel = '';
    this.profileId = '';
    this.physicalContextCode = '';
    this.venueName = '';
    this.menuBrandEnabled = false;
    this.brandColour = '#d7a14a';
    this.logoUrl = '';
    this.menuCoverUrl = '';
    this.location = '';
    this.participantId = '';
    this.participantSecret = '';
    this.guestDesign = null;
    this.paymentsActive = false;
    this.currency = 'ZAR';
    localStorage.removeItem('leos.guestDesign');
    localStorage.removeItem('leos.session');
  }
}
