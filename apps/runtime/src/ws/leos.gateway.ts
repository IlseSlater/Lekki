import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { EventEnvelope } from '@lekki/contracts';
import { EventBusService } from '../events/event-bus.service';
import { StaffTokenService } from '../staff-auth/staff-token.service';

type OperateRole = 'kitchen' | 'bar' | 'waiter' | 'counter' | 'staff';

/**
 * Live rooms:
 * - Guest: org:{org}:session:{sessionId}
 * - Operate: org:{org}:operate:{kitchen|bar|waiter|counter|staff}
 * Operate join requires staff token (ADR-004).
 */
@WebSocketGateway({
  cors: { origin: true },
})
@Injectable()
export class LeosGateway implements OnGatewayInit, OnGatewayConnection, OnModuleInit {
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(EventBusService) private readonly bus: EventBusService,
    private readonly staffTokens: StaffTokenService,
  ) {}

  onModuleInit() {
    this.bus.subscribe((envelope) => this.project(envelope));
  }

  afterInit() {}

  handleConnection(client: Socket) {
    const { organisationId, sessionId, operateRole, staffToken } = client.handshake.query;
    if (organisationId && sessionId) {
      client.join(this.sessionRoom(String(organisationId), String(sessionId)));
    }
    if (organisationId && operateRole) {
      const ok = this.authorizeOperate(String(staffToken || ''), String(operateRole));
      if (ok) this.joinOperate(client, String(organisationId), String(operateRole));
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    client: Socket,
    payload: {
      organisationId: string;
      sessionId?: string;
      operateRole?: string;
      operateRoles?: string[];
      staffToken?: string;
    },
  ) {
    const joined: string[] = [];
    if (payload.organisationId && payload.sessionId) {
      const room = this.sessionRoom(payload.organisationId, payload.sessionId);
      client.join(room);
      joined.push(room);
    }
    const roles = [
      ...(payload.operateRole ? [payload.operateRole] : []),
      ...(payload.operateRoles ?? []),
    ];
    const token =
      payload.staffToken ||
      (client.handshake.query['staffToken'] as string | undefined) ||
      '';
    for (const role of roles) {
      if (!this.authorizeOperate(token, role)) continue;
      const room = this.joinOperate(client, payload.organisationId, role);
      if (room) joined.push(room);
    }
    return { joined };
  }

  private authorizeOperate(token: string, roleRaw: string): boolean {
    const role = this.normRole(roleRaw);
    if (!role) return false;
    // Monitor / Studio overview may pass monitor=1 without staff — allow waiter/staff read rooms only if token missing? Plan: require token for operate.
    // Allow operate join without token for monitor reads via HTTP only; WS without token = no operate room (poll fallback).
    if (!token) return false;
    try {
      const claims = this.staffTokens.verify(token);
      if (claims.role === 'staff') return true;
      if (claims.role === role) return true;
      if (claims.role === 'waiter' && role === 'waiter') return true;
      return false;
    } catch {
      return false;
    }
  }

  private joinOperate(client: Socket, organisationId: string, roleRaw: string): string | null {
    const role = this.normRole(roleRaw);
    if (!role || !organisationId) return null;
    const room = this.operateRoom(organisationId, role);
    client.join(room);
    if (role === 'staff') {
      for (const r of ['kitchen', 'bar', 'waiter', 'counter'] as OperateRole[]) {
        client.join(this.operateRoom(organisationId, r));
      }
    }
    return room;
  }

  private sessionRoom(organisationId: string, sessionId: string) {
    return `org:${organisationId}:session:${sessionId}`;
  }

  private operateRoom(organisationId: string, role: OperateRole) {
    return `org:${organisationId}:operate:${role}`;
  }

  private normRole(raw: string): OperateRole | null {
    const r = (raw || '').toLowerCase();
    if (r === 'floor') return 'waiter';
    if (r === 'kitchen' || r === 'bar' || r === 'waiter' || r === 'counter' || r === 'staff') {
      return r;
    }
    return null;
  }

  private stationOperateRole(stationId: string | undefined): OperateRole | null {
    const id = (stationId || '').toLowerCase();
    if (!id) return null;
    if (id.includes('bar') && !id.includes('barista')) return 'bar';
    if (id.includes('counter') || id.includes('cafe') || id.includes('café')) return 'counter';
    if (id.includes('kitchen') || id.includes('food-truck') || id.includes('room-service')) {
      return 'kitchen';
    }
    return 'kitchen';
  }

  private operateRolesFor(envelope: EventEnvelope): OperateRole[] {
    const name = envelope.eventName;
    const stationId = envelope.payload?.['stationId'] as string | undefined;
    const roles = new Set<OperateRole>();

    if (
      name === 'FulfilmentCreated' ||
      name === 'FulfilmentStatusChanged' ||
      name === 'TransactionCreated' ||
      name === 'LinesClaimed' ||
      name === 'SessionCompleted' ||
      name === 'AssistanceRequested' ||
      name === 'AssistanceAcknowledged' ||
      name === 'AssistanceResolved'
    ) {
      roles.add('waiter');
      roles.add('staff');
    }

    if (name === 'FulfilmentCreated' || name === 'FulfilmentStatusChanged') {
      const stationRole = this.stationOperateRole(stationId);
      if (stationRole) roles.add(stationRole);
    }

    return [...roles];
  }

  private project(envelope: EventEnvelope) {
    const sessionId = envelope.payload?.['sessionId'] as string | undefined;
    if (sessionId) {
      const room = this.sessionRoom(envelope.organisationId, sessionId);
      this.server.to(room).emit('platform.event', envelope);
    } else {
      this.server.emit('platform.event', envelope);
    }

    for (const role of this.operateRolesFor(envelope)) {
      this.server
        .to(this.operateRoom(envelope.organisationId, role))
        .emit('platform.event', envelope);
    }
  }
}
