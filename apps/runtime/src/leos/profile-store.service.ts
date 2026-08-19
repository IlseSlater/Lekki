import { Injectable } from '@nestjs/common';
import type { ExperienceProfileDefinition } from '@lekki/contracts';
import { InMemoryProfileStore } from '@lekki/profile-engine';
import { registerRestaurantPack } from '@lekki/pack-restaurant';
import { registerHotelPack } from '@lekki/pack-hotel';
import { registerFestivalPack } from '@lekki/pack-festival';
import { registerAirportPack } from '@lekki/pack-airport';
import { registerHealthcarePack } from '@lekki/pack-healthcare';

@Injectable()
export class ProfileStoreService extends InMemoryProfileStore {
  constructor() {
    super();
    registerRestaurantPack(this);
    registerHotelPack(this);
    registerFestivalPack(this);
    registerAirportPack(this);
    registerHealthcarePack(this);
  }

  registerProfile(profile: ExperienceProfileDefinition) {
    this.register(profile);
  }
}
