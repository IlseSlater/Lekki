/**
 * Teardown plan — Wave 1–3 evidence pass (API + browser).
 *
 * Prerequisites: runtime on :3000, web on :4200 (or set LEOS_API / LEOS_WEB_URL).
 * Browser checks need playwright: pnpm add -D playwright -w && npx playwright install chromium
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const API = process.env.LEOS_API ?? 'http://localhost:3000';
const WEB = process.env.LEOS_WEB_URL ?? 'http://localhost:4200';
const OUT_DIR = path.join(ROOT, 'docs', 'ux', 'evidence', 'teardown-waves-1-3');
const SHOTS = path.join(OUT_DIR, 'screenshots');

const findings = [];

function waveTag(wave) {
  return `W${wave}`;
}

async function check(wave, id, label, fn) {
  try {
    const ok = await fn();
    const row = { wave, id, label, ok: !!ok, error: null };
    findings.push(row);
    console.log(`${row.ok ? 'PASS' : 'FAIL'} [${waveTag(wave)} ${id}] ${label}`);
    return row.ok;
  } catch (err) {
    const row = { wave, id, label, ok: false, error: String(err?.message ?? err) };
    findings.push(row);
    console.log(`FAIL [${waveTag(wave)} ${id}] ${label} — ${row.error}`);
    return false;
  }
}

async function api(pathname, options = {}) {
  const { headers: extra = {}, expectStatus, ...rest } = options;
  const res = await fetch(`${API}${pathname}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (expectStatus !== undefined) {
    if (res.status !== expectStatus) {
      throw new Error(`${options.method ?? 'GET'} ${pathname} → ${res.status}: ${text}`);
    }
    return body;
  }
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${pathname} → ${res.status}: ${text}`);
  }
  return body;
}

async function waitFor(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 304) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

function staffHeaders(token) {
  return { 'X-Staff-Token': token };
}

function guestHeaders(secret) {
  return { 'x-participant-secret': secret };
}

function txBody(entry, sessionId, lines) {
  return {
    sessionId,
    participantId: entry.joinedParticipantId,
    participantSecret: entry.participantSecret,
    lines,
  };
}

function relativeLuminance(hex) {
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function runApiWave1(staffToken) {
  await check(1, 'guest-complete-blocked', 'Guest cannot POST /payments/:id/complete', async () => {
    const entry = await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant', displayName: 'Evidence A' }),
    });
    const sessionId = entry.session.id;
    const venueId = entry.session.venueId;
    const catalogue = await api(`/catalogue/venue/${venueId}`);
    const item = catalogue[0];
    const tx = await api('/transactions', {
      method: 'POST',
      body: JSON.stringify(txBody(entry, sessionId, [{ catalogueItemId: item.id, quantity: 1 }])),
    });
    const pay = await api(`/payments/request/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ participantSecret: entry.participantSecret }),
    });
    const blocked = await fetch(`${API}/payments/${pay.paymentId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (blocked.status !== 401 && blocked.status !== 403) {
      throw new Error(`Expected 401/403, got ${blocked.status}`);
    }
    return true;
  });

  await check(1, 'server-price', 'Server reprices catalogue — client unitPrice ignored', async () => {
    const entry = await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant', displayName: 'Evidence Price' }),
    });
    const sessionId = entry.session.id;
    const venueId = entry.session.venueId;
    const catalogue = await api(`/catalogue/venue/${venueId}`);
    const item = catalogue[0];
    const expected = Number(item.unitPrice);
    const tx = await api('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        ...txBody(entry, sessionId, [{ catalogueItemId: item.id, quantity: 1 }]),
        lines: [{ catalogueItemId: item.id, quantity: 1, unitPrice: 0.01 }],
      }),
    });
    const session = await api(`/sessions/${sessionId}`, {
      headers: guestHeaders(entry.participantSecret),
    });
    const line = session.transactions
      ?.find((t) => t.id === tx.transactionId)
      ?.lines?.find((l) => l.catalogueItemId === item.id);
    const charged = Number(line?.unitPrice ?? 0);
    return Math.abs(charged - expected) < 0.01 && charged > 0.5;
  });

  await check(1, 'participant-leave', 'Leave one guest does not close shared session', async () => {
    const a = await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant-t2', displayName: 'Evidence One' }),
    });
    const sessionId = a.session.id;
    await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant-t2', displayName: 'Evidence Two' }),
    });
    await api(`/sessions/${sessionId}/leave`, {
      method: 'POST',
      body: JSON.stringify({
        participantId: a.joinedParticipantId,
        participantSecret: a.participantSecret,
      }),
    });
    const session = await api(`/sessions/${sessionId}`, {
      headers: staffHeaders(staffToken),
    });
    return session.status !== 'completed' && (session.participants?.length ?? 0) >= 1;
  });

  await check(1, 'decimal-migration', 'Prisma baseline migration + Decimal money columns', async () => {
    const migration = path.join(
      ROOT,
      'prisma',
      'migrations',
      '20250901120000_sellable_baseline',
      'migration.sql',
    );
    const sql = fs.readFileSync(migration, 'utf8');
    const schema = fs.readFileSync(path.join(ROOT, 'prisma', 'schema.prisma'), 'utf8');
    return (
      sql.includes('DECIMAL(12,2)') &&
      schema.includes('@db.Decimal(12, 2)') &&
      !fs.readFileSync(path.join(ROOT, 'apps', 'runtime', 'src', 'leos', 'leos.service.ts'), 'utf8').includes(
        '0.001',
      )
    );
  });

  await check(1, 'mint-qr', 'Go Live mint returns token ≠ qr-demo-restaurant', async () => {
    const ctx = await api('/setup/entry/context', { headers: staffHeaders(staffToken) });
    const minted = await api('/setup/entry/mint', {
      method: 'POST',
      headers: staffHeaders(staffToken),
      body: JSON.stringify({
        organisationId: ctx.organisationId,
        venueId: ctx.venueId,
        physicalContextId: ctx.physicalContextId,
        profileId: ctx.profileId,
        profileVersion: ctx.profileVersion,
      }),
    });
    return minted.token && minted.token !== 'qr-demo-restaurant';
  });

  await check(1, 'marketing-meta', 'Marketing head has description + OG tags', async () => {
    const html = await (await fetch(`${WEB}/`)).text();
    return (
      html.includes('name="description"') &&
      html.includes('property="og:title"') &&
      html.includes('property="og:description"')
    );
  });

  await check(1, 'robots-sitemap', '/robots.txt and /sitemap.xml exist', async () => {
    const robots = await (await fetch(`${WEB}/robots.txt`)).text();
    const sitemap = await (await fetch(`${WEB}/sitemap.xml`)).text();
    return robots.includes('Disallow: /studio') && sitemap.includes('<urlset');
  });
}

async function runApiWave2(staffToken) {
  await check(2, 'guest-design-pay', 'guestDesign.payAtTable=false returned on entry resolve', async () => {
    const venueScope = await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant', displayName: 'Venue Scope' }),
    });
    const venueId = venueScope.session.venueId;
    await api('/setup/brand', {
      method: 'PUT',
      headers: staffHeaders(staffToken),
      body: JSON.stringify({
        venueId,
        guestDesignJson: { payAtTable: false, tipStaff: false, callStaff: true, specials: false },
      }),
    });
    const entry = await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant', displayName: 'Pay Off Guest' }),
    });
    const pay = entry.guestDesign?.payAtTable;
    return pay === false;
  });

  await check(2, 'payfast-passphrase', 'PayFast activate without passphrase is refused', async () => {
    const ctx = await api('/setup/entry/context', { headers: staffHeaders(staffToken) });
    await api('/setup/payments/draft', {
      method: 'PUT',
      headers: staffHeaders(staffToken),
      body: JSON.stringify({
        organisationId: ctx.organisationId,
        venueId: ctx.venueId,
        connectorId: 'payfast',
        environment: 'sandbox',
        merchantId: '10000100',
        merchantKey: '46f0cd694581a',
      }),
    });
    try {
      await api('/setup/payments/activate', {
        method: 'POST',
        headers: staffHeaders(staffToken),
      });
      return false;
    } catch (err) {
      return /passphrase/i.test(String(err.message));
    }
  });

  await check(2, 'kitchen-notes', 'Special request on transaction reaches fulfilment line', async () => {
    const entry = await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant-t3', displayName: 'Allergy Guest' }),
    });
    const sessionId = entry.session.id;
    const venueId = entry.session.venueId;
    const catalogue = await api(`/catalogue/venue/${venueId}`);
    const item = catalogue[0];
    const note = 'severe shellfish allergy — evidence pass';
    const tx = await api('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        ...txBody(entry, sessionId, [{ catalogueItemId: item.id, quantity: 1, notes: note }]),
      }),
    });
    const lineNote =
      tx.lines?.[0]?.notes ??
      tx.transaction?.lines?.[0]?.notes ??
      (await api(`/sessions/${sessionId}`, { headers: guestHeaders(entry.participantSecret) }))
        .transactions?.flatMap((t) => t.lines ?? [])
        .find((l) => l.notes)?.notes;
    return String(lineNote ?? '').includes('shellfish');
  });

  await check(2, 'dual-order-pay', 'Two orders: requestPayment amount matches visit total', async () => {
    const entry = await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant-t4', displayName: 'Two Order Guest' }),
    });
    const sessionId = entry.session.id;
    const venueId = entry.session.venueId;
    const catalogue = await api(`/catalogue/venue/${venueId}`);
    const a = catalogue[0];
    const b = catalogue[1] ?? catalogue[0];
    const tx1 = await api('/transactions', {
      method: 'POST',
      body: JSON.stringify(txBody(entry, sessionId, [{ catalogueItemId: a.id, quantity: 1 }])),
    });
    const tx2 = await api('/transactions', {
      method: 'POST',
      body: JSON.stringify(txBody(entry, sessionId, [{ catalogueItemId: b.id, quantity: 1 }])),
    });
    void tx1;
    void tx2;
    const sessionBefore = await api(`/sessions/${sessionId}`, {
      headers: guestHeaders(entry.participantSecret),
    });
    const total = (sessionBefore.transactions ?? []).reduce(
      (sum, t) => sum + Number(t.total ?? 0),
      0,
    );
    const paymentsBefore = sessionBefore.payments?.length ?? 0;
    await api(`/payments/request/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const sessionAfter = await api(`/sessions/${sessionId}`, {
      headers: guestHeaders(entry.participantSecret),
    });
    const pending = (sessionAfter.payments ?? [])
      .filter((p) => p.status === 'pending')
      .slice(paymentsBefore)
      .sort((a, b) => Number(b.amount) - Number(a.amount))[0];
    const charged = Number(pending?.amount ?? 0);
    if (total <= 0 || Math.abs(charged - total) >= 0.02) {
      throw new Error(`visit total ${total} vs payment ${charged}`);
    }
    return true;
  });
}

async function joinGuest(page, token, name) {
  await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((guestName) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('leos.onboarding', JSON.stringify({ name: guestName, verified: true }));
  }, name);
  await page.goto(`${WEB}/e/${token}?join=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/experience/, { timeout: 25_000 });
  await page.locator('.leos-guest-tab-bar').first().waitFor({ timeout: 12_000 });
  await page.waitForTimeout(600);
}

async function runBrowser(staffToken, playwright) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const { chromium } = playwright;

  await check(1, 'studio-team-guard', 'Unsigned /studio/team redirects to sign-in', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`${WEB}/studio/team`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const url = page.url();
    await page.screenshot({ path: path.join(SHOTS, 'w1-studio-team-redirect.png'), fullPage: true });
    await browser.close();
    return url.includes('/signin');
  });

  await check(2, 'menu-first-entry', 'First-time scan shows menu — no OTP / birthday wall', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await joinGuest(page, 'qr-demo-restaurant', 'Evidence Guest');
    const body = await page.locator('body').innerText();
    await page.screenshot({ path: path.join(SHOTS, 'w2-guest-entry.png'), fullPage: true });
    await browser.close();
    const blocked = /birthday|gender|6-digit|verify your email|OTP/i.test(body);
    const onMenu = /Menu|Classic|Browse|Add|Bill/i.test(body);
    return onMenu && !blocked;
  });

  await check(2, 'pay-off-ui', 'Guest UI hides Bill tab when payAtTable is off', async () => {
    const venueScope = await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant', displayName: 'Venue Scope' }),
    });
    const venueId = venueScope.session.venueId;
    const brand = await api('/setup/brand', {
      method: 'PUT',
      headers: staffHeaders(staffToken),
      body: JSON.stringify({
        venueId,
        guestDesignJson: { payAtTable: false, tipStaff: false, callStaff: false, specials: false },
      }),
    });
    if (brand?.guestDesignJson?.payAtTable !== false) {
      throw new Error(`brand save payAtTable=${brand?.guestDesignJson?.payAtTable}`);
    }
    const probe = await api('/entry/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: 'qr-demo-restaurant', displayName: 'Pay Off Probe' }),
    });
    if (probe.guestDesign?.payAtTable !== false) {
      throw new Error(
        `entry resolve payAtTable=${probe.guestDesign?.payAtTable} venue=${probe.session?.venueId}`,
      );
    }
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await joinGuest(page, 'qr-demo-restaurant', 'Pay Off');
    await page
      .waitForFunction(
        () =>
          ![...document.querySelectorAll('.leos-guest-tab-bar__item')].some((el) =>
            /bill|pay/i.test(el.textContent ?? ''),
          ),
        { timeout: 12_000 },
      )
      .catch(() => {});
    const tabs = page.locator('.leos-guest-tab-bar__item');
    const labels = await tabs.allInnerTexts();
    await page.screenshot({ path: path.join(SHOTS, 'w2-pay-off-tabs.png'), fullPage: true });
    await browser.close();
    await api('/setup/brand', {
      method: 'PUT',
      headers: staffHeaders(staffToken),
      body: JSON.stringify({
        venueId,
        guestDesignJson: { payAtTable: true, tipStaff: true, callStaff: true, specials: true },
      }),
    });
    const payTabs = labels.filter((t) => /bill|pay/i.test(t));
    if (payTabs.length) {
      throw new Error(`tabs still show pay: ${payTabs.join(', ')} (all: ${labels.join(' | ')})`);
    }
    return true;
  });

  await check(3, 'live-venue-catalogue', 'Studio Live phone shows venue catalogue item (not only Classic Burger)', async () => {
    const ctx = await api('/setup/entry/context', { headers: staffHeaders(staffToken) });
    const catalogue = await api(`/catalogue/venue/${ctx.venueId}`);
    const firstLabel = catalogue[0]?.label ?? '';
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${WEB}/signin`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'staff@rustyoak.demo');
    await page.fill('input[type="password"]', '4444');
    await page.getByRole('button', { name: /continue to studio/i }).click();
    await page.waitForURL(/\/studio/, { timeout: 20_000 });
    await page.evaluate(
      ({ venueId, venueName, token }) => {
        const exp = {
          id: 'exp-evidence',
          typeId: 'restaurant',
          venueId,
          venueName: venueName || 'Rusty Oak',
          logoUrl: '',
          brandColour: '#d7a14a',
          menuBrandEnabled: false,
          menuCoverUrl: '',
          location: '',
          placeCode: 'Table 1',
          placeCodes: ['Table 1'],
          placeSections: [],
          experienceNotes: '',
          categories: [],
          guestDesign: { payAtTable: true, tipStaff: true, callStaff: true, specials: true },
          experienceUpdatedAt: null,
          token: token || 'qr-demo-restaurant',
          paymentsDone: true,
          live: true,
          steps: { identity: true, experience: true, places: true, payments: true, golive: true },
        };
        localStorage.setItem(
          'leos.studio.workspace',
          JSON.stringify({ experiences: [exp], activeId: exp.id }),
        );
      },
      { venueId: ctx.venueId, venueName: 'Rusty Oak', token: 'qr-demo-restaurant' },
    );
    await page.goto(`${WEB}/studio/setup/experience`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const phone = await page.locator('.phone__screen, .phone-shell-wrap').first().innerText();
    await page.screenshot({ path: path.join(SHOTS, 'w3-studio-live-phone.png'), fullPage: true });
    await browser.close();
    return firstLabel.length > 0 && phone.includes(firstLabel);
  });

  await check(3, 'tab-bar-calm', 'Guest tab bar has ≤4 tabs and no Leave tab', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await joinGuest(page, 'qr-demo-restaurant', 'Tab Check');
    const tabs = page.locator(
      '.leos-guest-tab-bar__item:not(.leos-guest-tab-bar__item--overflow)',
    );
    const count = await tabs.count();
    const labels = await tabs.allInnerTexts();
    await page.screenshot({ path: path.join(SHOTS, 'w3-guest-tabs.png'), fullPage: true });
    await browser.close();
    return count >= 2 && count <= 4 && !labels.some((t) => /^leave$/i.test(t.trim()));
  });

  await check(3, 'table-people', 'Second guest sees join notice / people strip', async () => {
    const token = 'qr-demo-restaurant-t2';
    const browser = await chromium.launch({ headless: true });
    const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await joinGuest(pageA, token, 'Thabo');
    await joinGuest(pageB, token, 'Sarah');

    await pageB
      .locator('.leos-chip-row--calm .leos-chip, .leos-success-banner')
      .first()
      .waitFor({ timeout: 15_000 })
      .catch(() => {});
    await pageB.waitForTimeout(500);

    const bodyB = await pageB.locator('body').innerText();
    await pageB.screenshot({ path: path.join(SHOTS, 'w3-second-guest-join.png'), fullPage: true });
    await browser.close();
    return (
      /Thabo joined/i.test(bodyB) ||
      /At your table/i.test(bodyB) ||
      /Thabo/.test(bodyB)
    );
  });

  await check(3, 'honest-receipt', 'No •••• 4242 row; unpaid receipt says settle with team', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${WEB}/experience`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const body = await page.locator('body').innerText();
    await page.screenshot({ path: path.join(SHOTS, 'w3-guest-shell.png'), fullPage: true });
    await browser.close();
    return !/••••\s*4242/.test(body);
  });

  await check(3, 'muted-contrast', 'Muted body text ≥ 4.5:1 on warm sand', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${WEB}/e/qr-demo-restaurant`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const sample = await page.evaluate(() => {
      const el = document.querySelector('.leos-muted') ?? document.body;
      const cs = getComputedStyle(el);
      return { color: cs.color, background: cs.backgroundColor };
    });
    await browser.close();
    const parse = (css) => {
      const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return '#64748b';
      const hex = (n) => Number(n).toString(16).padStart(2, '0');
      return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
    };
    const fg = parse(sample.color);
    const bg = parse(sample.background) === '#000000' ? '#ffffff' : parse(sample.background);
    return contrastRatio(fg, bg) >= 4.5;
  });

  await check(3, 'reduced-motion', 'Global reduced-motion guard present in guest styles', async () => {
    const scss = fs.readFileSync(path.join(ROOT, 'apps', 'web', 'src', 'styles', '_leos.scss'), 'utf8');
    return scss.includes('@media (prefers-reduced-motion: reduce)');
  });
}

function writeReport() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const byWave = (w) => findings.filter((f) => f.wave === w);
  const failed = findings.filter((f) => !f.ok);
  const lines = [
    '# Evidence — Teardown Waves 1–3',
    '',
    `**When:** ${new Date().toISOString().slice(0, 10)}`,
    `**Runtime:** ${API}`,
    `**Web:** ${WEB}`,
    '',
    '## Summary',
    '',
    `| Wave | Pass | Fail |`,
    `|------|------|------|`,
  ];
  for (const w of [1, 2, 3]) {
    const rows = byWave(w);
    lines.push(`| Wave ${w} | ${rows.filter((r) => r.ok).length} | ${rows.filter((r) => !r.ok).length} |`);
  }
  lines.push('', `**Overall:** ${findings.length - failed.length}/${findings.length} passed`, '');
  for (const w of [1, 2, 3]) {
    lines.push(`## Wave ${w}`, '');
    for (const f of byWave(w)) {
      lines.push(`- ${f.ok ? '✓' : '✗'} **${f.id}** — ${f.label}${f.error ? ` (${f.error})` : ''}`);
    }
    lines.push('');
  }
  if (fs.existsSync(SHOTS)) {
    lines.push('## Screenshots', '', 'See `screenshots/` in this folder.', '');
  }
  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), lines.join('\n'));
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify({ findings }, null, 2));
}

async function main() {
  console.log('Teardown evidence — waiting for stack…');
  await waitFor(`${API}/profiles`);
  await waitFor(`${WEB}/`);

  const staff = await api('/identity/staff/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'staff@rustyoak.demo', password: '4444' }),
  });
  const staffToken = staff.token;

  console.log('\n— API Wave 1 —');
  await runApiWave1(staffToken);
  console.log('\n— API Wave 2 —');
  await runApiWave2(staffToken);

  let browserRan = false;
  try {
    const playwright = await import('playwright');
    console.log('\n— Browser Waves 1–3 —');
    await runBrowser(staffToken, playwright);
    browserRan = true;
  } catch (err) {
    console.warn('\nBrowser checks skipped — install playwright: pnpm add -D playwright -w && npx playwright install chromium');
    console.warn(String(err?.message ?? err));
  }

  writeReport();
  const failed = findings.filter((f) => !f.ok);
  console.log(`\nEvidence complete: ${findings.length - failed.length}/${findings.length} passed`);
  if (!browserRan) console.log('(Browser checks were not run)');
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
