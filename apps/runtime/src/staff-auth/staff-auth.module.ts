import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StaffTokenService } from './staff-token.service';
import { StaffAuthGuard } from './staff-auth.guard';

@Module({
  imports: [PrismaModule],
  providers: [StaffTokenService, StaffAuthGuard],
  exports: [StaffTokenService, StaffAuthGuard],
})
export class StaffAuthModule {}
