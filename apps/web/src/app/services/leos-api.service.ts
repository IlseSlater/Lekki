import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { resolveApiBaseUrl } from './public-origin';
import { OperateStaffSessionService } from './operate-staff-session.service';
import type { GuestExperienceDesign } from '../studio/guest-experience-design';

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
      guestDesign?: Record<string, unknown> | null;
      currency?: string;
      joinedParticipantId?: string | null;
      participantSecret?: string;
    }>(`${this.api}/entry/resolve`, body);
  }

  /** Studio Identity → Venue menu brand (Guest Continuity). */
  saveVenueBrand(body: {
    venueId: string;
    menuBrandEnabled: boolean;
    brandColour?: string;
    venueName?: string;
    guestDesignJson?: Record<string, unknown>;
  }) {
    return this.http.put<{
      id: string;
      name: string;
      menuBrandEnabled: boolean;
      brandColour: string;
    }>(`${this.api}/setup/brand`, body, { headers: this.staffAuthHeaders() });
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
      scope?: 'visit' | 'mine' | 'equal';
      participantId?: string;
      participantSecret?: string;
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
    },
  ) {
    return this.http.post(`${this.api}/catalogue/venue/${venueId}`, body, {
      headers: this.staffAuthHeaders(),
    });
  }

  updateCatalogueItem(
    id: string,
    body: {
      label?: string;
      unitPrice?: number;
      category?: string;
      available?: boolean;
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

  getSession(sessionId: string, participantSecret?: string) {
    return this.http.get<{
      id: string;
      status: string;
      correlationId: string;
      placeCode?: string | null;
      venueName?: string | null;
      menuBrandEnabled?: boolean;
      brandColour?: string | null;
      guestDesign?: Record<string, unknown> | null;
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
        lines: Array<{
          id: string;
          label: string;
          quantity: number;
          unitPrice: number;
          participantId?: string | null;
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
        helpCount: number;
        helpKinds: string[];
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
  /** Continuity — this guest’s SessionParticipant id (mine vs visit). */
  participantId = '';
  /** Server-issued secret — resume this phone only, never by display name. */
  participantSecret = '';
  /** Venue guest experience design from entry resolve (not Studio localStorage). */
  guestDesign: Record<string, unknown> | null = null;
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
    this.participantId = '';
    this.participantSecret = '';
    this.guestDesign = null;
    this.currency = 'ZAR';
    localStorage.removeItem('leos.guestDesign');
    localStorage.removeItem('leos.session');
  }
}
