import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { SessionAccessService } from '../leos/session-access.service';
import {
  OptionalStaff,
  RequireStaffPermission,
  StaffAuthGuard,
} from '../staff-auth/staff-auth.guard';
import { StaffTokenService, type StaffTokenClaims } from '../staff-auth/staff-token.service';

@Controller('assistance')
export class AssistanceController {
  constructor(
    private readonly leos: LeosService,
    private readonly sessionAccess: SessionAccessService,
    private readonly staffTokens: StaffTokenService,
  ) {}

  @Post()
  request(
    @Body() body: { sessionId: string; kind?: string; message?: string },
  ) {
    return this.leos.requestAssistance(body);
  }

  /**
   * With sessionId: guest (x-participant-secret) or staff of that visit's org.
   * Without: floor-wide list for staff, scoped to their organisation only.
   */
  @Get()
  async list(
    @Req() req: { headers: Record<string, string | undefined> },
    @Query('sessionId') sessionId?: string,
    @Query('kind') kind?: string,
  ) {
    const sid = sessionId?.trim();
    if (sid) {
      const session = await this.sessionAccess.assertReadAccess(sid, req.headers);
      return this.leos.listAssistance({
        organisationId: session.organisationId,
        sessionId: sid,
        kind,
      });
    }
    const header =
      req.headers['x-staff-token'] || req.headers['authorization'] || req.headers['Authorization'];
    if (!header) throw new UnauthorizedException('Staff authentication required');
    const claims = this.staffTokens.verify(header);
    await this.staffTokens.assertActive(claims);
    return this.leos.listAssistance({ organisationId: claims.org, kind });
  }

  /**
   * Staff ack for service help; Studio Operate may claim manager escalations
   * without a staff token (owner oversight — ADR-004).
   */
  @Post(':id/acknowledge')
  @UseGuards(StaffAuthGuard)
  @OptionalStaff()
  @RequireStaffPermission('staff.service')
  acknowledge(
    @Param('id') id: string,
    @Req() req: { staff?: StaffTokenClaims },
  ) {
    return this.leos
      .acknowledgeAssistance(id, { staffPresent: !!req.staff })
      .catch((err: Error) => {
        if (/Staff authentication required/i.test(err.message)) {
          throw new ForbiddenException(err.message);
        }
        throw err;
      });
  }

  @Post(':id/resolve')
  @UseGuards(StaffAuthGuard)
  @OptionalStaff()
  @RequireStaffPermission('staff.service')
  resolve(
    @Param('id') id: string,
    @Req() req: { staff?: StaffTokenClaims },
  ) {
    return this.leos
      .resolveAssistance(id, { staffPresent: !!req.staff })
      .catch((err: Error) => {
        if (/Staff authentication required/i.test(err.message)) {
          throw new ForbiddenException(err.message);
        }
        throw err;
      });
  }
}
