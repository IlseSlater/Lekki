import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hasPermission, type StaffPrincipal } from '@lekki/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { newId } from '@lekki/shared';

export type StaffTokenClaims = {
  sub: string;
  org: string;
  role: string;
  name: string;
  permissions: string[];
  sid: string;
  exp: number;
};

const TTL_MS = 12 * 60 * 60 * 1000; // 12h shared-device shift

@Injectable()
export class StaffTokenService {
  constructor(private readonly prisma: PrismaService) {}

  private secret() {
    return process.env['STAFF_TOKEN_SECRET'] || 'leos-dev-staff-token-secret';
  }

  sign(claims: Omit<StaffTokenClaims, 'exp'> & { exp?: number }): string {
    const payload: StaffTokenClaims = {
      ...claims,
      exp: claims.exp ?? Date.now() + TTL_MS,
    };
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = createHmac('sha256', this.secret()).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  verify(token: string | undefined | null): StaffTokenClaims {
    if (!token) throw new UnauthorizedException('Staff token required');
    const raw = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const [body, sig] = raw.split('.');
    if (!body || !sig) throw new UnauthorizedException('Invalid staff token');
    const expected = createHmac('sha256', this.secret()).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid staff token');
    }
    let claims: StaffTokenClaims;
    try {
      claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StaffTokenClaims;
    } catch {
      throw new UnauthorizedException('Invalid staff token');
    }
    if (!claims.exp || claims.exp < Date.now()) {
      throw new UnauthorizedException('Staff session expired');
    }
    return claims;
  }

  toPrincipal(claims: StaffTokenClaims): StaffPrincipal {
    return {
      id: claims.sub,
      organisationId: claims.org,
      displayName: claims.name,
      role: claims.role,
      permissions: claims.permissions as StaffPrincipal['permissions'],
      sessionId: claims.sid,
    };
  }

  async issueLogin(input: {
    staffId: string;
    organisationId: string;
    displayName: string;
    role: string;
    permissions: string[];
    deviceLabel?: string;
  }) {
    const sid = newId('ssn');
    await this.prisma.staffSession.create({
      data: {
        id: sid,
        staffMemberId: input.staffId,
        organisationId: input.organisationId,
        deviceLabel: input.deviceLabel?.trim() || null,
      },
    });
    if (input.deviceLabel?.trim()) {
      const label = input.deviceLabel.trim();
      await this.prisma.staffDevice.upsert({
        where: {
          organisationId_label: {
            organisationId: input.organisationId,
            label,
          },
        },
        create: {
          id: newId('dev'),
          organisationId: input.organisationId,
          label,
          lastStaffId: input.staffId,
          lastStaffName: input.displayName,
        },
        update: {
          lastStaffId: input.staffId,
          lastStaffName: input.displayName,
          lastSeenAt: new Date(),
        },
      });
    }
    const token = this.sign({
      sub: input.staffId,
      org: input.organisationId,
      role: input.role,
      name: input.displayName,
      permissions: input.permissions,
      sid,
    });
    return { token, sessionId: sid };
  }

  async touch(sessionId: string) {
    await this.prisma.staffSession
      .update({
        where: { id: sessionId },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => undefined);
  }

  async revoke(sessionId: string) {
    await this.prisma.staffSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    }).catch(() => undefined);
  }

  async assertActive(claims: StaffTokenClaims) {
    const row = await this.prisma.staffSession.findUnique({ where: { id: claims.sid } });
    if (!row || row.revokedAt) throw new UnauthorizedException('Staff session ended');
    void this.touch(claims.sid);
    return claims;
  }

  requirePermission(claims: StaffTokenClaims, permission: string) {
    if (!hasPermission(claims.permissions, permission)) {
      throw new UnauthorizedException(`Missing permission: ${permission}`);
    }
  }

  /** Experience assignment — station board access. */
  canAccessStation(role: string, stationId: string): boolean {
    if (role === 'staff') return true;
    if (role === 'waiter') return true; // serve / handoff visibility
    const id = (stationId || '').toLowerCase();
    if (role === 'kitchen') {
      return (
        id.includes('kitchen') ||
        id.includes('food-truck') ||
        id.includes('room-service') ||
        (!id.includes('bar') && !id.includes('counter'))
      );
    }
    if (role === 'bar') return id.includes('bar');
    if (role === 'counter') {
      return id.includes('counter') || id.includes('cafe') || id.includes('café') || id.includes('gate');
    }
    return false;
  }
}
