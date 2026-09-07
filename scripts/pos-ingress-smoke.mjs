/**
 * Manual POS ingress smoke — Pilot webhook → place/SKU resolve → outbox + billMinor.
 *
 * Prerequisites: Postgres up, mapping migrations applied, db:seed, runtime on :3000.
 * Requires PILOT_POS_WEBHOOK_SECRET in the environment (same value the runtime uses).
 */
const API = process.env.LEOS_API ?? 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.PILOT_POS_WEBHOOK_SECRET?.trim() ?? '';

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${res.status} ${res.url}: ${text}`);
  }
}

async function request(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders ?? {}) },
  });
  const body = res.status === 204 ? null : await json(res);
  if (!res.ok) {
    throw new Error(
      `${options.method ?? 'GET'} ${path} → ${res.status}: ${JSON.stringify(body)}`,
    );
  }
  return body;
}

async function waitForRuntime(timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${API}/health`);
      if (res.ok) return await res.json();
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Runtime not reachable at ${API}`);
}

async function main() {
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET.length < 16) {
    throw new Error(
      'Set PILOT_POS_WEBHOOK_SECRET (16+ chars) to the same value the runtime process uses',
    );
  }

  console.log('Waiting for LEOS runtime…');
  const health = await waitForRuntime();
  console.log('✓ Health', { database: health.database, outbox: health.outbox?.status });

  const entry = await request('/entry/resolve', {
    method: 'POST',
    body: JSON.stringify({
      token: 'qr-demo-restaurant',
      displayName: 'POS Smoke Guest',
    }),
  });
  const sessionId = entry.session.id;
  const venueId = entry.session.venueId;
  const billBefore = entry.session.billMinor ?? 0;
  console.log('✓ Session on T1 (TBL-12)', { sessionId, venueId, billBefore });

  const lineId = `PILOT-SMOKE-${Date.now()}`;
  const notify = await request(`/integrations/pos/pilot/notify/${venueId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
    body: JSON.stringify({
      lineId,
      placeId: 'TBL-12',
      checkId: 'CHK-SMOKE-1',
      sku: 'BEER-01',
      label: 'Castle Lite',
      quantity: 2,
      unitPrice: 28.5,
    }),
  });
  console.log('✓ Webhook', notify);

  if (notify.ignored) {
    throw new Error(`Ingress ignored unexpectedly: ${JSON.stringify(notify)}`);
  }
  if (!notify.transactionId) {
    throw new Error(`Missing transactionId: ${JSON.stringify(notify)}`);
  }

  const dup = await request(`/integrations/pos/pilot/notify/${venueId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
    body: JSON.stringify({
      lineId,
      placeId: 'TBL-12',
      checkId: 'CHK-SMOKE-1',
      sku: 'BEER-01',
      label: 'Castle Lite',
      quantity: 2,
      unitPrice: 28.5,
    }),
  });
  if (!dup.duplicated) {
    throw new Error(`Expected idempotent duplicate: ${JSON.stringify(dup)}`);
  }
  console.log('✓ Idempotent retry', dup);

  const session = await request(`/sessions/${sessionId}`, {
    headers: { 'x-participant-secret': entry.participantSecret },
  });
  const billAfter = session.billMinor ?? session.session?.billMinor;
  const expectedDelta = 5700; // 2 × R28.50 → R57.00 → 5700 minor
  console.log('✓ Session after ingress', {
    status: session.status ?? session.session?.status,
    billMinor: billAfter,
    expectedBillMinor: billBefore + expectedDelta,
  });

  if (typeof billAfter === 'number' && billAfter !== billBefore + expectedDelta) {
    throw new Error(
      `billMinor mismatch: got ${billAfter}, want ${billBefore + expectedDelta}`,
    );
  }

  // Unmapped place should not retry-storm the till.
  const ignored = await request(`/integrations/pos/pilot/notify/${venueId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
    body: JSON.stringify({
      lineId: `PILOT-SMOKE-MISS-${Date.now()}`,
      placeId: 'TBL-MISSING',
      sku: 'BEER-01',
      label: 'Ghost Pint',
      quantity: 1,
      unitPrice: 10,
    }),
  });
  if (!ignored.ignored || ignored.reason !== 'no_active_session_for_place') {
    throw new Error(`Expected ignored miss: ${JSON.stringify(ignored)}`);
  }
  console.log('✓ Missing place ignored', ignored);

  console.log('\nPOS ingress smoke PASSED');
}

main().catch((err) => {
  console.error('\nPOS ingress smoke FAILED');
  console.error(err);
  process.exit(1);
});
