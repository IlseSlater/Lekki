import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { WaiterTablesService } from '../leos/waiter-tables.service';
import {
  OptionalStaff,
  RequireStaffPermission,
  StaffAuthGuard,
} from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';

@Controller('assistance')
export class AssistanceController {
  constructor(
    private readonly leos: LeosService,
    private readonly tables: WaiterTablesService,
  ) {}

  @Post()
  request(
    @Body() body: { sessionId: string; kind?: string; message?: string },
  ) {
    return this.leos.requestAssistance(body);
  }

  @Get()
  @UseGuards(StaffAuthGuard)
  list(
    @Req() req: { staff?: StaffTokenClaims },
    @Query('sessionId') sessionId?: string,
    @Query('kind') kind?: string,
    @Query('venueId') venueId?: string,
  ) {
    const staff = req.staff!;
    const canList =
      staff.permissions?.includes('staff.service') ||
      staff.permissions?.includes('organisation.manage') ||
      staff.permissions?.includes('session.read');
    if (!canList) {
      throw new ForbiddenException('Staff permission required');
    }
    return this.leos.listAssistance({
      organisationId: staff.org,
      sessionId,
      kind,
      venueId,
    });
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
      .then(async (result) => {
        const sessionId = (result as { sessionId?: string } | null)?.sessionId;
        const isServiceAsk = (result as { kind?: string } | null)?.kind !== 'manager';
        if (sessionId && isServiceAsk) {
          await this.tables.takeIfFree(sessionId, req.staff).catch(() => null);
        }
        return result;
      })
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
