import { Controller, Get, Param } from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { ProfileStoreService } from '../leos/profile-store.service';

@Controller('profiles')
export class ProfileController {
  constructor(
    private readonly leos: LeosService,
    private readonly store: ProfileStoreService,
  ) {}

  @Get()
  list() {
    return this.store.list();
  }

  @Get(':profileId/:version/terminology/:key')
  async terminology(
    @Param('profileId') profileId: string,
    @Param('version') version: string,
    @Param('key') key: string,
  ) {
    return this.leos
      .getProfileEngine()
      .resolveTerminology({ profileId, version }, key);
  }
}
