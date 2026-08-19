/**
 * Real Postgres E2E heartbeat smoke test against a running LEOS runtime.
 *
 * Prerequisites:
 *   docker compose up -d
 *   pnpm run db:push && pnpm run db:seed
 *   pnpm run build:packages && pnpm --filter @lekki/runtime-app build
 *   pnpm run dev:runtime   (in another terminal, or started by this script)
 */
const API = process.env.LEOS_API ?? 'http://localhost:3000';

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${res.status} ${res.url}: ${text}`);
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${options.method ?? 'GET'} ${path} → ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return json(res);
}

async function waitForRuntime(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${API}/profiles`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Runtime not reachable at ${API}`);
}

async function main() {
  console.log('Waiting for LEOS runtime…');
  await waitForRuntime();

  const entry = await request('/entry/resolve', {
    method: 'POST',
    body: JSON.stringify({
      token: 'qr-demo-restaurant',
      displayName: 'E2E Guest',
    }),
  });

  const sessionId = entry.session.id;
  const venueId = entry.session.venueId;
  console.log('✓ Entry → session', sessionId);

  const catalogue = await request(`/catalogue/venue/${venueId}`);
  if (!catalogue.length) throw new Error('Catalogue empty');
  const food = catalogue.find((i) => i.routingTags.includes('food')) ?? catalogue[0];
  const drink =
    catalogue.find((i) => i.routingTags.includes('beverage')) ?? catalogue[1] ?? food;

  const tx = await request('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      lines: [
        {
          catalogueItemId: food.id,
          label: food.label,
          quantity: 1,
          unitPrice: food.unitPrice,
          routingTags: food.routingTags,
        },
        {
          catalogueItemId: drink.id,
          label: drink.label,
          quantity: 1,
          unitPrice: drink.unitPrice,
          routingTags: drink.routingTags,
        },
      ],
    }),
  });
  console.log('✓ Transaction', tx.transactionId, 'fulfilments', tx.fulfilments?.length);

  const kitchen = await request('/fulfilments/station/station-kitchen');
  if (!kitchen.length) throw new Error('Expected kitchen fulfilment');

  const fid = kitchen[0].id;
  const sessionBefore = await request(`/sessions/${sessionId}`);
  if (!sessionBefore.fulfilments?.length) throw new Error('Session missing fulfilments for Live Order');

  await request(`/fulfilments/${fid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'preparing' }),
  });
  console.log('✓ Fulfilment status → preparing (In Progress)');

  await request(`/fulfilments/${fid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ready' }),
  });
  console.log('✓ Fulfilment status → ready (G-06 Ready)');

  await request(`/fulfilments/${fid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'delivered' }),
  });
  console.log('✓ Fulfilment status → delivered (Completed)');

  const sessionLive = await request(`/sessions/${sessionId}`);
  const updated = sessionLive.fulfilments?.find((f) => f.id === fid);
  if (!updated || updated.status !== 'delivered') {
    throw new Error(
      `Expected delivered on fulfilment ${fid}, got ${updated?.status ?? 'missing'} (session has ${sessionLive.fulfilments?.length ?? 0} fulfilments)`,
    );
  }
  console.log('✓ G-06 Experience Progress projection on session');

  await request('/assistance', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      kind: 'service',
      message: 'E2E assistance',
    }),
  });
  console.log('✓ Assistance requested');

  const payment = await request(`/payments/request/${sessionId}`, { method: 'POST' });
  if (payment.checkout?.method === 'form_post') {
    console.log('✓ Payment requested (gateway checkout) — settle via ITN in production');
  } else {
    await request(`/payments/${payment.paymentId}/complete`, { method: 'POST' });
    console.log('✓ Payment completed');
  }

  await request(`/sessions/${sessionId}/close`, { method: 'POST' });
  console.log('✓ Session closed — PhysicalContext free');

  // Café proof — deepened Pack UX (own venue, board catalogue, counter station)
  const cafe = await request('/entry/resolve', {
    method: 'POST',
    body: JSON.stringify({
      token: 'qr-demo-cafe',
      displayName: 'Cafe Guest',
    }),
  });
  const cafeSession = cafe.session.id;
  const cafeVenue = cafe.session.venueId;
  if (cafe.session.profileId && cafe.session.profileId !== 'profile-cafe') {
    throw new Error(`Expected profile-cafe, got ${cafe.session.profileId}`);
  }
  console.log('✓ Café profile session', cafeSession);

  const cafeCatalogue = await request(`/catalogue/venue/${cafeVenue}`);
  if (!cafeCatalogue.length) throw new Error('Café catalogue empty — Pack seed missing');
  if (cafeCatalogue.some((i) => i.id === 'item-burger')) {
    throw new Error('Café venue should not share restaurant catalogue');
  }
  const cafeItem =
    cafeCatalogue.find((i) => i.id?.startsWith('cafe-') || i.routingTags?.includes('beverage')) ??
    cafeCatalogue[0];
  const cafeTx = await request('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: cafeSession,
      lines: [
        {
          catalogueItemId: cafeItem.id,
          label: cafeItem.label,
          quantity: 1,
          unitPrice: cafeItem.unitPrice,
          routingTags: cafeItem.routingTags,
        },
      ],
    }),
  });
  if (!cafeTx.fulfilments?.length) throw new Error('Café fulfilment missing');
  console.log('✓ Café transaction + fulfilment (zero Platform change)');

  const cafeFid =
    cafeTx.fulfilments[0].fulfilmentId ?? cafeTx.fulfilments[0].id;
  if (!cafeFid) throw new Error('Café fulfilment id missing');

  const counter = await request('/fulfilments/station/station-counter');
  if (!counter.some((f) => f.id === cafeFid)) {
    throw new Error('Café fulfilment not routed to station-counter');
  }
  console.log('✓ Café fulfilment routed to counter station');

  await request(`/fulfilments/${cafeFid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ready' }),
  });
  console.log('✓ Café fulfilment → ready via same Capability API');

  await request(`/sessions/${cafeSession}/close`, { method: 'POST' });
  console.log('✓ Café session closed — Platform Proof: Café Proven (deepened UX)');

  // Hotel proof — third Pack, same Platform
  const hotel = await request('/entry/resolve', {
    method: 'POST',
    body: JSON.stringify({
      token: 'qr-demo-hotel',
      displayName: 'Hotel Guest',
    }),
  });
  const hotelSession = hotel.session.id;
  const hotelVenue = hotel.session.venueId;
  if (hotel.session.profileId && hotel.session.profileId !== 'profile-hotel') {
    throw new Error(`Expected profile-hotel, got ${hotel.session.profileId}`);
  }
  console.log('✓ Hotel profile session', hotelSession);

  const hotelCatalogue = await request(`/catalogue/venue/${hotelVenue}`);
  if (!hotelCatalogue.length) throw new Error('Hotel catalogue empty — Pack seed missing');
  const hotelFood =
    hotelCatalogue.find((i) => i.routingTags?.includes('room-service') || i.routingTags?.includes('food')) ??
    hotelCatalogue[0];
  const hotelTx = await request('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: hotelSession,
      lines: [
        {
          catalogueItemId: hotelFood.id,
          label: hotelFood.label,
          quantity: 1,
          unitPrice: hotelFood.unitPrice,
          routingTags: hotelFood.routingTags,
        },
      ],
    }),
  });
  if (!hotelTx.fulfilments?.length) throw new Error('Hotel fulfilment missing');
  console.log('✓ Hotel transaction + fulfilment (zero Platform change)');

  const hotelFid =
    hotelTx.fulfilments[0].fulfilmentId ?? hotelTx.fulfilments[0].id;
  if (!hotelFid) throw new Error('Hotel fulfilment id missing');

  const roomService = await request('/fulfilments/station/station-room-service');
  if (!roomService.some((f) => f.id === hotelFid)) {
    throw new Error('Hotel fulfilment not routed to station-room-service');
  }
  console.log('✓ Hotel fulfilment routed to room-service station');

  await request(`/fulfilments/${hotelFid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ready' }),
  });
  console.log('✓ Hotel fulfilment → ready via same Capability API');

  await request(`/sessions/${hotelSession}/close`, { method: 'POST' });
  console.log('✓ Hotel session closed — Platform Proof: Hotel Pack without core changes');

  // Festival proof — fourth Pack, same Platform
  const fest = await request('/entry/resolve', {
    method: 'POST',
    body: JSON.stringify({
      token: 'qr-demo-festival',
      displayName: 'Festival Attendee',
    }),
  });
  const festSession = fest.session.id;
  const festVenue = fest.session.venueId;
  if (fest.session.profileId && fest.session.profileId !== 'profile-festival') {
    throw new Error(`Expected profile-festival, got ${fest.session.profileId}`);
  }
  console.log('✓ Festival profile session', festSession);

  const festCatalogue = await request(`/catalogue/venue/${festVenue}`);
  if (!festCatalogue.length) throw new Error('Festival catalogue empty — Pack seed missing');
  const festFood =
    festCatalogue.find((i) => i.routingTags?.includes('food')) ?? festCatalogue[0];
  const festTx = await request('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: festSession,
      lines: [
        {
          catalogueItemId: festFood.id,
          label: festFood.label,
          quantity: 1,
          unitPrice: festFood.unitPrice,
          routingTags: festFood.routingTags,
        },
      ],
    }),
  });
  if (!festTx.fulfilments?.length) throw new Error('Festival fulfilment missing');
  console.log('✓ Festival transaction + fulfilment (zero Platform change)');

  const festFid =
    festTx.fulfilments[0].fulfilmentId ?? festTx.fulfilments[0].id;
  if (!festFid) throw new Error('Festival fulfilment id missing');

  const foodTruck = await request('/fulfilments/station/station-food-truck');
  if (!foodTruck.some((f) => f.id === festFid)) {
    throw new Error('Festival fulfilment not routed to station-food-truck');
  }
  console.log('✓ Festival fulfilment routed to food-truck station');

  await request(`/fulfilments/${festFid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ready' }),
  });
  console.log('✓ Festival fulfilment → ready via same Capability API');

  await request(`/sessions/${festSession}/close`, { method: 'POST' });
  console.log('✓ Festival session closed — Platform Proof: Festival Pack without core changes');

  // Airport proof — fifth Pack, same Platform
  const air = await request('/entry/resolve', {
    method: 'POST',
    body: JSON.stringify({
      token: 'qr-demo-airport',
      displayName: 'Traveller',
    }),
  });
  const airSession = air.session.id;
  const airVenue = air.session.venueId;
  if (air.session.profileId && air.session.profileId !== 'profile-airport') {
    throw new Error(`Expected profile-airport, got ${air.session.profileId}`);
  }
  console.log('✓ Airport profile session', airSession);

  const airCatalogue = await request(`/catalogue/venue/${airVenue}`);
  if (!airCatalogue.length) throw new Error('Airport catalogue empty — Pack seed missing');
  const airFood =
    airCatalogue.find((i) => i.routingTags?.includes('food')) ?? airCatalogue[0];
  const airTx = await request('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: airSession,
      lines: [
        {
          catalogueItemId: airFood.id,
          label: airFood.label,
          quantity: 1,
          unitPrice: airFood.unitPrice,
          routingTags: airFood.routingTags,
        },
      ],
    }),
  });
  if (!airTx.fulfilments?.length) throw new Error('Airport fulfilment missing');
  console.log('✓ Airport transaction + fulfilment (zero Platform change)');

  const airFid =
    airTx.fulfilments[0].fulfilmentId ?? airTx.fulfilments[0].id;
  if (!airFid) throw new Error('Airport fulfilment id missing');

  const gateCafe = await request('/fulfilments/station/station-gate-cafe');
  if (!gateCafe.some((f) => f.id === airFid)) {
    throw new Error('Airport fulfilment not routed to station-gate-cafe');
  }
  console.log('✓ Airport fulfilment routed to gate-cafe station');

  await request(`/fulfilments/${airFid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ready' }),
  });
  console.log('✓ Airport fulfilment → ready via same Capability API');

  await request(`/sessions/${airSession}/close`, { method: 'POST' });
  console.log('✓ Airport session closed — Platform Proof: Airport Pack without core changes');

  // Healthcare proof — sixth Pack, same Platform (waiting-bay amenities, not clinical care)
  const hc = await request('/entry/resolve', {
    method: 'POST',
    body: JSON.stringify({
      token: 'qr-demo-healthcare',
      displayName: 'Clinic Visitor',
    }),
  });
  const hcSession = hc.session.id;
  const hcVenue = hc.session.venueId;
  if (hc.session.profileId && hc.session.profileId !== 'profile-healthcare') {
    throw new Error(`Expected profile-healthcare, got ${hc.session.profileId}`);
  }
  console.log('✓ Healthcare profile session', hcSession);

  const hcCatalogue = await request(`/catalogue/venue/${hcVenue}`);
  if (!hcCatalogue.length) throw new Error('Healthcare catalogue empty — Pack seed missing');
  const hcFood =
    hcCatalogue.find((i) => i.routingTags?.includes('food') || i.routingTags?.includes('beverage')) ??
    hcCatalogue[0];
  const hcTx = await request('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: hcSession,
      lines: [
        {
          catalogueItemId: hcFood.id,
          label: hcFood.label,
          quantity: 1,
          unitPrice: hcFood.unitPrice,
          routingTags: hcFood.routingTags,
        },
      ],
    }),
  });
  if (!hcTx.fulfilments?.length) throw new Error('Healthcare fulfilment missing');
  console.log('✓ Healthcare transaction + fulfilment (zero Platform change)');

  const hcFid =
    hcTx.fulfilments[0].fulfilmentId ?? hcTx.fulfilments[0].id;
  if (!hcFid) throw new Error('Healthcare fulfilment id missing');

  const clinicCafe = await request('/fulfilments/station/station-clinic-cafe');
  if (!clinicCafe.some((f) => f.id === hcFid)) {
    throw new Error('Healthcare fulfilment not routed to station-clinic-cafe');
  }
  console.log('✓ Healthcare fulfilment routed to clinic-cafe station');

  await request(`/fulfilments/${hcFid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ready' }),
  });
  console.log('✓ Healthcare fulfilment → ready via same Capability API');

  await request(`/sessions/${hcSession}/close`, { method: 'POST' });
  console.log('✓ Healthcare session closed — Platform Proof: Healthcare Pack without core changes');

  console.log('\nPostgres E2E heartbeat smoke test passed.');
  console.log(
    'Platform Proof Index: Restaurant ✓ · Café ✓ · Hotel ✓ · Festival ✓ · Airport ✓ · Healthcare ✓ (Reusable Packs)',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
