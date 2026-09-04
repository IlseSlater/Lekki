import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StaffTokenService } from './staff-token.service';
import { StaffAuthGuard } from './staff-auth.guard';
import { PinLoginGuardService } from './pin-login-guard.service';

@Module({
  imports: [PrismaModule],
  providers: [StaffTokenService, StaffAuthGuard, PinLoginGuardService],
  exports: [StaffTokenService, StaffAuthGuard, PinLoginGuardService],
})
export class StaffAuthModule {}
