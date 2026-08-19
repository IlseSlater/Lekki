import {

  BadRequestException,

  Body,

  Controller,

  Get,

  NotFoundException,

  Param,

  Patch,

  Post,

  Query,

  UnauthorizedException,

} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { newId } from '@lekki/shared';

import * as bcrypt from 'bcryptjs';

import { StaffTokenService } from '../staff-auth/staff-token.service';



/** Staff Experience homes — ADR-004 (not Studio). */

const ROLE_PATH: Record<string, string> = {

  kitchen: '/staff/station/kitchen',

  bar: '/staff/station/bar',

  waiter: '/staff/service',

  staff: '/staff/service',

  counter: '/staff/station/counter',

};



const VALID_ROLES = new Set(['kitchen', 'bar', 'waiter', 'staff', 'counter']);



@Controller('identity')

export class IdentityController {

  constructor(

    private readonly prisma: PrismaService,

    private readonly staffTokens: StaffTokenService,

  ) {}



  @Post('guest')

  async createGuest(@Body() body: { displayName: string; consentGranted?: boolean }) {

    return this.prisma.identity.create({

      data: {

        id: newId('id'),

        displayName: body.displayName,

        consentGranted: body.consentGranted ?? false,

      },

    });

  }



  /** Staff directory for Operate login picker (no secrets). */

  @Get('staff')

  async listStaff(@Query('organisationId') organisationId?: string) {

    const rows = await this.prisma.staffMember.findMany({

      where: organisationId ? { organisationId } : undefined,

      orderBy: [{ role: 'asc' }, { displayName: 'asc' }],

      select: {

        id: true,

        displayName: true,

        email: true,

        role: true,

        organisationId: true,

        permissions: true,

      },

    });

    return rows.map((s) => ({

      ...s,

      homePath: ROLE_PATH[s.role] ?? ROLE_PATH.staff,

    }));

  }



  @Post('staff/login')

  async staffLogin(

    @Body() body: { email: string; password: string; deviceLabel?: string },

  ) {

    const staff = await this.prisma.staffMember.findUnique({

      where: { email: (body.email || '').trim().toLowerCase() },

    });

    if (!staff || !(await bcrypt.compare(body.password || '', staff.passwordHash))) {

      throw new UnauthorizedException('Invalid email or password');

    }

    const issued = await this.staffTokens.issueLogin({

      staffId: staff.id,

      organisationId: staff.organisationId,

      displayName: staff.displayName,

      role: staff.role,

      permissions: staff.permissions,

      deviceLabel: body.deviceLabel,

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



  @Post('staff/logout')

  async staffLogout(@Body() body: { sessionId?: string; token?: string }) {

    let sid = body.sessionId;

    if (!sid && body.token) {

      try {

        sid = this.staffTokens.verify(body.token).sid;

      } catch {

        return { ok: true };

      }

    }

    if (sid) await this.staffTokens.revoke(sid);

    return { ok: true };

  }



  /** Studio Team — devices */

  @Get('staff/devices')

  async listDevices(@Query('organisationId') organisationId?: string) {

    const where = organisationId ? { organisationId } : undefined;

    const [devices, active] = await Promise.all([

      this.prisma.staffDevice.findMany({

        where,

        orderBy: { lastSeenAt: 'desc' },

      }),

      this.prisma.staffSession.findMany({

        where: { ...(organisationId ? { organisationId } : {}), revokedAt: null },

        select: { deviceLabel: true },

      }),

    ]);

    const inUseLabels = new Set(

      active.map((s) => s.deviceLabel).filter((l): l is string => !!l && l.length > 0),

    );

    const horizon = Date.now() - 10 * 60 * 1000;

    return devices.map((d) => ({

      id: d.id,

      organisationId: d.organisationId,

      label: d.label,

      lastStaffId: d.lastStaffId,

      lastStaffName: d.lastStaffName,

      lastSeenAt: d.lastSeenAt.toISOString(),

      createdAt: d.createdAt.toISOString(),

      inUse: inUseLabels.has(d.label) || (!!d.lastStaffName && d.lastSeenAt.getTime() > horizon),

    }));

  }



  @Post('staff/devices')

  async createDevice(

    @Body() body: { organisationId?: string; label: string },

  ) {

    const label = (body.label || '').trim();

    if (!label) throw new BadRequestException('Device label required');

    let organisationId = (body.organisationId || '').trim();

    if (!organisationId) {

      const org = await this.prisma.organisation.findFirst({ orderBy: { createdAt: 'asc' } });

      organisationId = org?.id ?? '';

    }

    if (!organisationId) throw new BadRequestException('Organisation required');

    return this.prisma.staffDevice.create({

      data: {

        id: newId('dev'),

        organisationId,

        label,

      },

    });

  }



  /** Studio Team — active sessions + login history */

  @Get('staff/sessions')

  async listSessions(

    @Query('organisationId') organisationId?: string,

    @Query('active') active?: string,

  ) {

    const onlyActive = active === '1' || active === 'true';

    const rows = await this.prisma.staffSession.findMany({

      where: {

        ...(organisationId ? { organisationId } : {}),

        ...(onlyActive ? { revokedAt: null } : {}),

      },

      include: {

        staffMember: { select: { id: true, displayName: true, email: true, role: true } },

      },

      orderBy: { createdAt: 'desc' },

      take: 100,

    });

    return rows.map((r) => ({

      id: r.id,

      staffId: r.staffMemberId,

      displayName: r.staffMember.displayName,

      email: r.staffMember.email,

      role: r.staffMember.role,

      organisationId: r.organisationId,

      deviceLabel: r.deviceLabel,

      createdAt: r.createdAt.toISOString(),

      lastSeenAt: r.lastSeenAt.toISOString(),

      revokedAt: r.revokedAt?.toISOString() ?? null,

      active: !r.revokedAt,

    }));

  }



  @Post('staff/sessions/:id/revoke')

  async revokeSession(@Param('id') id: string) {

    await this.staffTokens.revoke(id);

    return { ok: true };

  }



  /** Studio Team — create staff with Experience Assignment. */

  @Post('staff')

  async createStaff(

    @Body()

    body: {

      organisationId?: string;

      displayName: string;

      email: string;

      pin: string;

      role: string;

      permissions?: string[];

    },

  ) {

    const role = (body.role || 'staff').trim().toLowerCase();

    if (!VALID_ROLES.has(role)) {

      throw new BadRequestException('Invalid experience role');

    }

    const email = (body.email || '').trim().toLowerCase();

    const pin = (body.pin || '').trim();

    let organisationId = (body.organisationId || '').trim();

    if (!organisationId) {

      const org = await this.prisma.organisation.findFirst({ orderBy: { createdAt: 'asc' } });

      organisationId = org?.id ?? '';

    }

    if (!organisationId || !body.displayName?.trim() || !email || pin.length < 4) {

      throw new BadRequestException('Name, email, and PIN (4+) required');

    }

    const created = await this.prisma.staffMember.create({

      data: {

        id: newId('staff'),

        organisationId,

        displayName: body.displayName.trim(),

        email,

        passwordHash: await bcrypt.hash(pin, 10),

        role,

        permissions: body.permissions?.length ? body.permissions : [],

      },

      select: {

        id: true,

        displayName: true,

        email: true,

        role: true,

        organisationId: true,

        permissions: true,

      },

    });

    return { ...created, homePath: ROLE_PATH[created.role] ?? ROLE_PATH.staff };

  }



  /** Studio Team — update Experience + permissions (+ optional PIN). */

  @Patch('staff/:id')

  async updateStaff(

    @Param('id') id: string,

    @Body()

    body: {

      displayName?: string;

      role?: string;

      permissions?: string[];

      pin?: string;

    },

  ) {

    const existing = await this.prisma.staffMember.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Staff not found');

    const role = body.role ? body.role.trim().toLowerCase() : undefined;

    if (role && !VALID_ROLES.has(role)) {

      throw new BadRequestException('Invalid experience role');

    }

    const data: {

      displayName?: string;

      role?: string;

      permissions?: string[];

      passwordHash?: string;

    } = {};

    if (body.displayName?.trim()) data.displayName = body.displayName.trim();

    if (role) data.role = role;

    if (body.permissions) data.permissions = body.permissions;

    if (body.pin && body.pin.trim().length >= 4) {

      data.passwordHash = await bcrypt.hash(body.pin.trim(), 10);

    }

    const updated = await this.prisma.staffMember.update({

      where: { id },

      data,

      select: {

        id: true,

        displayName: true,

        email: true,

        role: true,

        organisationId: true,

        permissions: true,

      },

    });

    return { ...updated, homePath: ROLE_PATH[updated.role] ?? ROLE_PATH.staff };

  }

}


