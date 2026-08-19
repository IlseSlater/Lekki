import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { resolveApiBaseUrl } from './public-origin';
import { OperateStaffSessionService } from './operate-staff-session.service';

@Injectable({ providedIn: 'root' })
export class LeosApiService {
  private socket?: Socket;
  private socketOrgId = '';
  private socketSessionId = '';
  private socketOperateRole = '';
  /** Same host as the page when opened from a phone on LAN (Restaurant App pattern). */
  private readonly api = resolveApiBaseUrl();
  private readonly staffSession = inject(OperateStaffSessionService);

  constructor(private readonly http: HttpClient) {}

  private staffAuthHeaders(): HttpHeaders | undefined {
    const h = this.staffSession.authHeaders();
    if (!h['X-Staff-Token']) return undefined;
    return new HttpHeaders(h);
  }

  resolveEntry(body: {
    token: string;
    displayName: string;
    identityId?: string;
    participantId?: string;
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
      joinedParticipantId?: string | null;
    }>(`${this.api}/entry/resolve`, body);
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
    lines: Array<{
      catalogueItemId: string;
      label: string;
      quantity: number;
      unitPrice: number;
      routingTags: string[];
    }>;
  }) {
    return this.http.post<{
      transactionId: string;
      fulfilments: Array<{ fulfilmentId: string; stationId: string; status: string }>;
    }>(`${this.api}/transactions`, body);
  }

  requestPayment(
    sessionId: string,
    body?: { tipAmount?: number; scope?: 'visit' | 'mine' | 'equal'; participantId?: string },
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

  completePayment(paymentId: string) {
    return this.http.post(`${this.api}/payments/${paymentId}/complete`, {});
  }

  closeSession(sessionId: string, opts?: { asOwner?: boolean }) {
    // Studio owner force-clear must not send a leftover staff token (session.close required if present).
    const headers = opts?.asOwner ? undefined : this.staffAuthHeaders();
    return this.http.post(`${this.api}/sessions/${sessionId}/close`, {}, { headers });
  }

  /** Claim-from-table — re-stamp open lines to this guest. */
  claimLines(sessionId: string, body: { participantId: string | null; lineIds: string[] }) {
    return this.http.post<{
      ok: boolean;
      claimed: number;
      lineIds: string[];
      undo: Array<{ lineId: string; previousParticipantId: string | null }>;
    }>(`${this.api}/sessions/${sessionId}/claim-lines`, body);
  }

  getSession(sessionId: string) {
    return this.http.get<{
      id: string;
      status: string;
      correlationId: string;
      placeCode?: string | null;
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
    }>(`${this.api}/sessions/${sessionId}`);
  }

  listFulfilments(stationId: string) {
    return this.http.get<
      Array<{
        id: string;
        status: string;
        stationId: string;
        sessionId?: string;
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
      params: {
        ...(params?.venueId ? { venueId: params.venueId } : {}),
        ...(params?.organisationId ? { organisationId: params.organisationId } : {}),
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
    } | null>(`${this.api}/setup/payments/install`);
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
    }>(`${this.api}/setup/payments/test-connection`, body);
  }

  savePaymentDraft(body: Record<string, unknown>) {
    return this.http.put(`${this.api}/setup/payments/draft`, body);
  }

  activatePaymentConnector() {
    return this.http.post<{
      ok: boolean;
      connectorId: string;
      activeConnectorId: string;
    }>(`${this.api}/setup/payments/activate`, {});
  }

  /** Grow Org Memory — yesterday / wait / calm trading breath. */
  getGrowOverview(token?: string) {
    return this.http.get<{
      venueName: string | null;
      venueId: string | null;
      guestsYesterday: number;
      guestsToday: number;
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
  ensureSocket(organisationId: string, sessionId: string) {
    if (!organisationId || !sessionId) return undefined;
    this.socketOrgId = organisationId;
    this.socketSessionId = sessionId;
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
  /** Continuity — this guest’s SessionParticipant id (mine vs visit). */
  participantId = '';

  persist() {
    localStorage.setItem('leos.session', JSON.stringify(this));
  }

  /** Re-scan / splash — resume this device’s participant instead of minting a ghost. */
  entryBody(token: string, displayName: string) {
    return {
      token,
      displayName,
      participantId: this.participantId || undefined,
    };
  }

  restore() {
    const raw = localStorage.getItem('leos.session');
    if (!raw) return;
    try {
      Object.assign(this, JSON.parse(raw));
    } catch {
      this.clear();
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
    this.participantId = '';
    localStorage.removeItem('leos.session');
  }
}
