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
import {
  OptionalStaff,
  RequireStaffPermission,
  StaffAuthGuard,
} from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';

@Controller('assistance')
export class AssistanceController {
  constructor(private readonly leos: LeosService) {}

  @Post()
  request(
    @Body() body: { sessionId: string; kind?: string; message?: string },
  ) {
    return this.leos.requestAssistance(body);
  }

  @Get()
  list(
    @Query('sessionId') sessionId?: string,
    @Query('kind') kind?: string,
  ) {
    return this.leos.listAssistance({ sessionId, kind });
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
