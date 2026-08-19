import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  registerRestaurantPack,
  seedCatalogue,
  cafeSeedCatalogue,
  RESTAURANT_PROFILE_ID,
  RESTAURANT_PROFILE_VERSION,
  CAFE_PROFILE_ID,
  CAFE_PROFILE_VERSION,
  RESTAURANT_PHYSICAL_CONTEXT_TYPE,
} from '@lekki/pack-restaurant';
import {
  registerHotelPack,
  hotelSeedCatalogue,
  HOTEL_PROFILE_ID,
  HOTEL_PROFILE_VERSION,
  HOTEL_PHYSICAL_CONTEXT_TYPE,
} from '@lekki/pack-hotel';
import {
  registerFestivalPack,
  festivalSeedCatalogue,
  FESTIVAL_PROFILE_ID,
  FESTIVAL_PROFILE_VERSION,
  FESTIVAL_PHYSICAL_CONTEXT_TYPE,
} from '@lekki/pack-festival';
import {
  registerAirportPack,
  airportSeedCatalogue,
  AIRPORT_PROFILE_ID,
  AIRPORT_PROFILE_VERSION,
  AIRPORT_PHYSICAL_CONTEXT_TYPE,
} from '@lekki/pack-airport';
import {
  registerHealthcarePack,
  healthcareSeedCatalogue,
  HEALTHCARE_PROFILE_ID,
  HEALTHCARE_PROFILE_VERSION,
  HEALTHCARE_PHYSICAL_CONTEXT_TYPE,
} from '@lekki/pack-healthcare';
import { InMemoryProfileStore } from '@lekki/profile-engine';
import { newId } from '@lekki/shared';

const prisma = new PrismaClient();

async function main() {
  await prisma.outboxMessage.deleteMany();
  await prisma.assistanceRequest.deleteMany();
  await prisma.fulfilmentLine.deleteMany();
  await prisma.fulfilment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.transactionLine.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.sessionParticipant.deleteMany();
  await prisma.experienceSession.deleteMany();
  await prisma.restaurantCatalogItem.deleteMany();
  await prisma.entryToken.deleteMany();
  await prisma.physicalContext.deleteMany();
  await prisma.staffSession.deleteMany();
  await prisma.staffDevice.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.identityConsent.deleteMany();
  await prisma.identity.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.organisation.deleteMany();

  const orgId = newId('org');
  const venueRestaurant = newId('ven');
  const venueCafe = newId('ven');
  const venueHotel = newId('ven');
  const venueFestival = newId('ven');
  const venueAirport = newId('ven');
  const venueHealthcare = newId('ven');
  const ctxRestaurant = newId('ctx');
  const ctxRestaurant2 = newId('ctx');
  const ctxRestaurant3 = newId('ctx');
  const ctxRestaurant4 = newId('ctx');
  const ctxCafe = newId('ctx');
  const ctxHotel = newId('ctx');
  const ctxFestival = newId('ctx');
  const ctxAirport = newId('ctx');
  const ctxHealthcare = newId('ctx');

  await prisma.organisation.create({
    data: { id: orgId, name: 'Lekki Demo Hospitality' },
  });

  await prisma.venue.createMany({
    data: [
      { id: venueRestaurant, organisationId: orgId, name: 'Rusty Oak' },
      { id: venueCafe, organisationId: orgId, name: 'Harbor Roast Café' },
      { id: venueHotel, organisationId: orgId, name: 'Harbor House Hotel' },
      { id: venueFestival, organisationId: orgId, name: 'Lekki Fields Festival' },
      { id: venueAirport, organisationId: orgId, name: 'Lekki International Gate B12' },
      { id: venueHealthcare, organisationId: orgId, name: 'Harbor Day Clinic' },
    ],
  });

  await prisma.physicalContext.createMany({
    data: [
      {
        id: ctxRestaurant,
        organisationId: orgId,
        venueId: venueRestaurant,
        code: 'T1',
        type: RESTAURANT_PHYSICAL_CONTEXT_TYPE,
      },
      {
        id: ctxRestaurant2,
        organisationId: orgId,
        venueId: venueRestaurant,
        code: 'T2',
        type: RESTAURANT_PHYSICAL_CONTEXT_TYPE,
      },
      {
        id: ctxRestaurant3,
        organisationId: orgId,
        venueId: venueRestaurant,
        code: 'T3',
        type: RESTAURANT_PHYSICAL_CONTEXT_TYPE,
      },
      {
        id: ctxRestaurant4,
        organisationId: orgId,
        venueId: venueRestaurant,
        code: 'T4',
        type: RESTAURANT_PHYSICAL_CONTEXT_TYPE,
      },
      {
        id: ctxCafe,
        organisationId: orgId,
        venueId: venueCafe,
        code: 'C1',
        type: 'COUNTER',
      },
      {
        id: ctxHotel,
        organisationId: orgId,
        venueId: venueHotel,
        code: '1204',
        type: HOTEL_PHYSICAL_CONTEXT_TYPE,
      },
      {
        id: ctxFestival,
        organisationId: orgId,
        venueId: venueFestival,
        code: 'ZONE-A',
        type: FESTIVAL_PHYSICAL_CONTEXT_TYPE,
      },
      {
        id: ctxAirport,
        organisationId: orgId,
        venueId: venueAirport,
        code: 'B12-14',
        type: AIRPORT_PHYSICAL_CONTEXT_TYPE,
      },
      {
        id: ctxHealthcare,
        organisationId: orgId,
        venueId: venueHealthcare,
        code: 'BAY-3',
        type: HEALTHCARE_PHYSICAL_CONTEXT_TYPE,
      },
    ],
  });

  await prisma.entryToken.createMany({
    data: [
      {
        token: 'qr-demo-restaurant',
        organisationId: orgId,
        venueId: venueRestaurant,
        physicalContextId: ctxRestaurant,
        profileId: RESTAURANT_PROFILE_ID,
        profileVersion: RESTAURANT_PROFILE_VERSION,
      },
      {
        token: 'qr-demo-restaurant-t2',
        organisationId: orgId,
        venueId: venueRestaurant,
        physicalContextId: ctxRestaurant2,
        profileId: RESTAURANT_PROFILE_ID,
        profileVersion: RESTAURANT_PROFILE_VERSION,
      },
      {
        token: 'qr-demo-restaurant-t3',
        organisationId: orgId,
        venueId: venueRestaurant,
        physicalContextId: ctxRestaurant3,
        profileId: RESTAURANT_PROFILE_ID,
        profileVersion: RESTAURANT_PROFILE_VERSION,
      },
      {
        token: 'qr-demo-restaurant-t4',
        organisationId: orgId,
        venueId: venueRestaurant,
        physicalContextId: ctxRestaurant4,
        profileId: RESTAURANT_PROFILE_ID,
        profileVersion: RESTAURANT_PROFILE_VERSION,
      },
      {
        token: 'qr-demo-cafe',
        organisationId: orgId,
        venueId: venueCafe,
        physicalContextId: ctxCafe,
        profileId: CAFE_PROFILE_ID,
        profileVersion: CAFE_PROFILE_VERSION,
      },
      {
        token: 'qr-demo-hotel',
        organisationId: orgId,
        venueId: venueHotel,
        physicalContextId: ctxHotel,
        profileId: HOTEL_PROFILE_ID,
        profileVersion: HOTEL_PROFILE_VERSION,
      },
      {
        token: 'qr-demo-festival',
        organisationId: orgId,
        venueId: venueFestival,
        physicalContextId: ctxFestival,
        profileId: FESTIVAL_PROFILE_ID,
        profileVersion: FESTIVAL_PROFILE_VERSION,
      },
      {
        token: 'qr-demo-airport',
        organisationId: orgId,
        venueId: venueAirport,
        physicalContextId: ctxAirport,
        profileId: AIRPORT_PROFILE_ID,
        profileVersion: AIRPORT_PROFILE_VERSION,
      },
      {
        token: 'qr-demo-healthcare',
        organisationId: orgId,
        venueId: venueHealthcare,
        physicalContextId: ctxHealthcare,
        profileId: HEALTHCARE_PROFILE_ID,
        profileVersion: HEALTHCARE_PROFILE_VERSION,
      },
    ],
  });

  for (const item of seedCatalogue) {
    await prisma.restaurantCatalogItem.create({
      data: {
        id: item.id,
        venueId: venueRestaurant,
        label: item.label,
        description: item.description,
        unitPrice: item.unitPrice,
        currency: item.currency,
        routingTags: item.routingTags,
        category: item.category,
        choiceGroups: item.choiceGroups ?? undefined,
      },
    });
  }

  for (const item of cafeSeedCatalogue) {
    await prisma.restaurantCatalogItem.create({
      data: {
        id: item.id,
        venueId: venueCafe,
        label: item.label,
        description: item.description,
        unitPrice: item.unitPrice,
        currency: item.currency,
        routingTags: item.routingTags,
        category: item.category,
        choiceGroups: item.choiceGroups ?? undefined,
      },
    });
  }

  for (const item of hotelSeedCatalogue) {
    await prisma.restaurantCatalogItem.create({
      data: {
        id: item.id,
        venueId: venueHotel,
        label: item.label,
        description: item.description,
        unitPrice: item.unitPrice,
        currency: item.currency,
        routingTags: item.routingTags,
        category: item.category,
      },
    });
  }

  for (const item of festivalSeedCatalogue) {
    await prisma.restaurantCatalogItem.create({
      data: {
        id: item.id,
        venueId: venueFestival,
        label: item.label,
        description: item.description,
        unitPrice: item.unitPrice,
        currency: item.currency,
        routingTags: item.routingTags,
        category: item.category,
      },
    });
  }

  for (const item of airportSeedCatalogue) {
    await prisma.restaurantCatalogItem.create({
      data: {
        id: item.id,
        venueId: venueAirport,
        label: item.label,
        description: item.description,
        unitPrice: item.unitPrice,
        currency: item.currency,
        routingTags: item.routingTags,
        category: item.category,
      },
    });
  }

  for (const item of healthcareSeedCatalogue) {
    await prisma.restaurantCatalogItem.create({
      data: {
        id: item.id,
        venueId: venueHealthcare,
        label: item.label,
        description: item.description,
        unitPrice: item.unitPrice,
        currency: item.currency,
        routingTags: item.routingTags,
        category: item.category,
      },
    });
  }

  const pin = async (code: string) => bcrypt.hash(code, 10);
  const staffPerms = [
    'session.read',
    'session.close',
    'fulfilment.read',
    'fulfilment.update',
    'payment.complete',
    'staff.service',
  ];

  await prisma.staffMember.createMany({
    data: [
      {
        id: newId('staff'),
        organisationId: orgId,
        displayName: 'Alex · Kitchen',
        email: 'kitchen@rustyoak.demo',
        passwordHash: await pin('1111'),
        role: 'kitchen',
        permissions: ['fulfilment.read', 'fulfilment.update', 'staff.service'],
      },
      {
        id: newId('staff'),
        organisationId: orgId,
        displayName: 'Sam · Bar',
        email: 'bar@rustyoak.demo',
        passwordHash: await pin('2222'),
        role: 'bar',
        permissions: ['fulfilment.read', 'fulfilment.update', 'staff.service'],
      },
      {
        id: newId('staff'),
        organisationId: orgId,
        displayName: 'Jordan · Waiter',
        email: 'waiter@rustyoak.demo',
        passwordHash: await pin('3333'),
        role: 'waiter',
        permissions: staffPerms,
      },
      {
        id: newId('staff'),
        organisationId: orgId,
        displayName: 'Riley · Staff',
        email: 'staff@rustyoak.demo',
        passwordHash: await pin('4444'),
        role: 'staff',
        permissions: staffPerms,
      },
    ],
  });

  const store = new InMemoryProfileStore();
  registerRestaurantPack(store);
  registerHotelPack(store);
  registerFestivalPack(store);
  registerAirportPack(store);
  registerHealthcarePack(store);
  const profiles = await store.list();
  console.log('Seeded profiles:', profiles.map((p) => `${p.id}@${p.version}`).join(', '));
  console.log(
    'Demo QR: qr-demo-restaurant (T1), qr-demo-restaurant-t2|t3|t4, cafe, hotel, festival, airport, healthcare',
  );
  console.log('Staff Experience (email / PIN → /staff):');
  console.log('  kitchen@rustyoak.demo / 1111  → Kitchen');
  console.log('  bar@rustyoak.demo / 2222      → Bar');
  console.log('  waiter@rustyoak.demo / 3333   → Waiter');
  console.log('  staff@rustyoak.demo / 4444    → Floor lead');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
