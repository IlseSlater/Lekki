import { BadRequestException, Body, Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { newId } from '@lekki/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StaffTokenService } from '../staff-auth/staff-token.service';

const ROLE_PATH: Record<string, string> = {
  kitchen: '/staff/station/kitchen',
  bar: '/staff/station/bar',
  waiter: '/staff/service',
  staff: '/staff/service',
  counter: '/staff/station/counter',
};

const STUDIO_PERMS = [
  'organisation.manage',
  'session.read',
  'session.close',
  'fulfilment.read',
  'fulfilment.update',
  'payment.complete',
  'staff.service',
];

function googleClientId() {
  return process.env.LEOS_GOOGLE_CLIENT_ID?.trim() || '';
}

@Controller('identity')
export class OauthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffTokens: StaffTokenService,
  ) {}

  @Get('oauth/google')
  googleConfig() {
    const clientId = googleClientId();
    return { enabled: Boolean(clientId), clientId: clientId || null };
  }

  @Post('staff/oauth/google')
  async googleStaffLogin(@Body() body: { accessToken?: string; credential?: string; deviceLabel?: string }) {
    const clientId = googleClientId();
    if (!clientId) {
      throw new BadRequestException('Google sign-in is not configured on this workspace.');
    }
    const profile = await this.verifyGoogle(body, clientId);
    const staff = await this.findOrProvision(profile);
    const issued = await this.staffTokens.issueLogin({
      staffId: staff.id,
      organisationId: staff.organisationId,
      displayName: staff.displayName,
      role: staff.role,
      permissions: staff.permissions,
      deviceLabel: body.deviceLabel || 'Studio · Google',
    });
    return {
      id: staff.id,
      organisationId: staff.organisationId,
      displayName: staff.displayName,
      email: staff.email,
      role: staff.role,
      permissions: staff.permissions,
      homePath: ROLE_PATH[staff.role] ?? ROLE_PATH.staff,
      token: issued.token,
      sessionId: issued.sessionId,
    };
  }

  private async verifyGoogle(
    body: { accessToken?: string; credential?: string },
    clientId: string,
  ): Promise<{ email: string; name: string }> {
    const credential = body.credential?.trim();
    const accessToken = body.accessToken?.trim();
    const url = credential
      ? `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      : accessToken
        ? `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
        : '';
    if (!url) {
      throw new BadRequestException('Google sign-in did not return a token.');
    }
    const res = await fetch(url);
    const info = (await res.json()) as {
      aud?: string;
      azp?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      error?: string;
      error_description?: string;
    };
    if (!res.ok) {
      throw new UnauthorizedException('Google sign-in failed.');
    }
    const audience = info.aud || info.azp;
    if (audience !== clientId) {
      throw new UnauthorizedException('Google sign-in failed.');
    }
    const verified = info.email_verified === true || info.email_verified === 'true';
    const email = info.email?.trim().toLowerCase();
    if (!email || !verified) {
      throw new UnauthorizedException('Google did not share a verified email.');
    }
    return { email, name: info.name?.trim() || '' };
  }

  private async findOrProvision(profile: { email: string; name: string }) {
    const existing = await this.prisma.staffMember.findUnique({ where: { email: profile.email } });
    if (existing) {
      if (!existing.active) {
        throw new UnauthorizedException('This operator account is no longer active.');
      }
      return existing;
    }
    if (process.env.LEOS_GOOGLE_PROVISION !== '1') {
      throw new UnauthorizedException('No operator account for this Google email. Ask your venue to add you in Team.');
    }
    const org = await this.prisma.organisation.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!org) {
      throw new UnauthorizedException('No venue is ready for Google sign-in yet.');
    }
    const local = profile.email.split('@')[0] || 'Operator';
    const displayName =
      profile.name ||
      local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return this.prisma.staffMember.create({
      data: {
        id: newId('staff'),
        organisationId: org.id,
        displayName,
        email: profile.email,
        passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
        role: 'staff',
        permissions: STUDIO_PERMS,
      },
    });
  }
}
