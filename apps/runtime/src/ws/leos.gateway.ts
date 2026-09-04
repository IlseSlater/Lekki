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
import { SessionAccessService } from '../leos/session-access.service';

type OperateRole = 'kitchen' | 'bar' | 'waiter' | 'counter' | 'staff';

/**
 * Live rooms:
 * - Guest: org:{org}:session:{sessionId} — participant secret or staff token required
 * - Operate: org:{org}:operate:{kitchen|bar|waiter|counter|staff} — staff token; org from claims
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
    private readonly sessionAccess: SessionAccessService,
  ) {}

  onModuleInit() {
    this.bus.subscribe((envelope) => this.project(envelope));
  }

  afterInit() {}

  /** Room joins require an authenticated `join` message — never trust connect query alone. */
  handleConnection(_client: Socket) {}

  @SubscribeMessage('join')
  async handleJoin(
    client: Socket,
    payload: {
      organisationId: string;
      sessionId?: string;
      operateRole?: string;
      operateRoles?: string[];
      staffToken?: string;
      participantSecret?: string;
    },
  ) {
    const joined: string[] = [];
    const token =
      payload.staffToken ||
      (client.handshake.query['staffToken'] as string | undefined) ||
      '';

    if (payload.sessionId) {
      const room = await this.tryJoinSession(
        client,
        payload.organisationId,
        payload.sessionId,
        payload.participantSecret ||
          (client.handshake.query['participantSecret'] as string | undefined),
        token,
      );
      if (room) joined.push(room);
    }

    const roles = [
      ...(payload.operateRole ? [payload.operateRole] : []),
      ...(payload.operateRoles ?? []),
    ];
    for (const role of roles) {
      const room = await this.tryJoinOperate(client, token, role);
      if (room) joined.push(room);
    }
    return { joined };
  }

  private async tryJoinSession(
    client: Socket,
    organisationId: string,
    sessionId: string,
    participantSecret: string | undefined,
    staffToken: string,
  ): Promise<string | null> {
    try {
      const session = await this.sessionAccess.assertReadAccess(sessionId, {
        'x-participant-secret': participantSecret,
        'x-staff-token': staffToken || undefined,
      });
      if (session.organisationId !== organisationId) return null;
      const room = this.sessionRoom(session.organisationId, sessionId);
      client.join(room);
      return room;
    } catch {
      return null;
    }
  }

  private async tryJoinOperate(
    client: Socket,
    token: string,
    roleRaw: string,
  ): Promise<string | null> {
    const role = this.normRole(roleRaw);
    if (!role || !token) return null;
    try {
      const claims = this.staffTokens.verify(token);
      await this.staffTokens.assertActive(claims);
      if (!this.roleAllowed(claims.role, role)) return null;
      return this.joinOperate(client, claims.org, role);
    } catch {
      return null;
    }
  }

  private roleAllowed(staffRole: string, requested: OperateRole): boolean {
    if (staffRole === 'staff') return true;
    if (staffRole === requested) return true;
    if (staffRole === 'waiter' && requested === 'waiter') return true;
    return false;
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
      this.server
        .to(this.operateRoom(envelope.organisationId, 'staff'))
        .emit('platform.event', envelope);
    }

    for (const role of this.operateRolesFor(envelope)) {
      this.server
        .to(this.operateRoom(envelope.organisationId, role))
        .emit('platform.event', envelope);
    }
  }
}
