const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.LEOS_WEB_URL || 'http://localhost:4200';
const OUT = path.join(process.env.TEMP || '/tmp', 'lekki-evidence-walk');
fs.mkdirSync(OUT, { recursive: true });

const findings = [];
function note(ok, msg) {
  findings.push({ ok, msg });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${msg}`);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PW_CHANNEL || 'chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);

  try {
    await page.goto(`${BASE}/signin`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"], input', 'evidence@lekki.test');
    await page.getByRole('button', { name: /continue|sign in|email/i }).first().click();
    await page.waitForURL(/\/studio/, { timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: path.join(OUT, '01-after-signin.png'), fullPage: true });

    // Ensure welcome path
    await page.goto(`${BASE}/studio/welcome`, { waitUntil: 'networkidle' });
    note(await page.getByText(/Let’s get your experience ready/i).isVisible(), 'Welcome purpose visible');
    note(await page.getByRole('link', { name: /^Continue$/i }).isVisible(), 'Welcome gold Continue');
    await page.screenshot({ path: path.join(OUT, '02-welcome.png'), fullPage: true });
    await page.getByRole('link', { name: /^Continue$/i }).click();

    await page.waitForURL(/\/studio\/create/);
    note(await page.getByText(/What experience are you creating/i).isVisible(), 'Choose purpose');
    note(await page.getByText(/Live Experience/i).first().isVisible(), 'Live Experience beside Choose');
    await page.getByRole('option', { name: /Restaurant/i }).click();
    note(await page.getByText(/Looks good/i).isVisible(), 'Choose confidence Looks good');
    await page.screenshot({ path: path.join(OUT, '03-create.png'), fullPage: true });
    await page.getByRole('button', { name: /^Continue$/i }).click();

    await page.waitForURL(/\/studio\/setup\/identity/);
    note(await page.getByText(/Who you are|welcoming/i).first().isVisible(), 'Identity purpose');
    note(await page.locator('.leos-studio-shell__mark').filter({ hasText: 'LEKKI' }).isVisible(), 'LEKKI top bar');
    note(await page.getByText(/Live Experience/i).first().isVisible(), 'Live pill / phone on Identity');
    const venue = page.locator('input[name="venue"]');
    await venue.fill('');
    await venue.fill('Blue Door Evidence');
    await page.waitForTimeout(400);
    note(
      await page.getByText('Blue Door Evidence').first().isVisible(),
      'Identity venue appears in Live arrival',
    );
    note(await page.getByText(/Welcome/i).first().isVisible(), 'Arrival Welcome line');
    note(await page.getByText(/Looks good/i).isVisible(), 'Identity Looks good');
    await page.screenshot({ path: path.join(OUT, '04-identity.png'), fullPage: true });
    await page.getByRole('button', { name: /^Continue$/i }).click();

    await page.waitForURL(/\/studio\/setup\/experience/);
    note(await page.getByText(/What can guests|What guests experience/i).first().isVisible(), 'Experience purpose');
    // If summary mode, click into edit if needed
    const continueEditing = page.getByRole('button', { name: /^Back$/i });
    await page.screenshot({ path: path.join(OUT, '05-experience.png'), fullPage: true });
    note(await page.getByText(/Looks good/i).isVisible(), 'Experience Looks good');
    await page.getByRole('button', { name: /^Continue$/i }).click();

    await page.waitForURL(/\/studio\/setup\/places/);
    note(await page.getByText(/Where guests join|where will guests/i).first().isVisible(), 'Places purpose');
    // Select first place row if present
    const placeRow = page.locator('.pl-row').first();
    if (await placeRow.count()) {
      await placeRow.click();
      await page.waitForTimeout(300);
    }
    note(await page.getByText(/You’re joining|You're joining/i).first().isVisible(), 'Places Live arrival');
    note(await page.getByText(/Looks good/i).isVisible(), 'Places Looks good');
    await page.screenshot({ path: path.join(OUT, '06-places.png'), fullPage: true });
    await page.getByRole('button', { name: /^Continue$/i }).click();

    await page.waitForURL(/\/studio\/setup\/payments/);
    note(await page.getByText(/How guests pay|pay with confidence/i).first().isVisible(), 'Payments purpose');
    note(await page.getByText(/Card|Apple Pay|Google Pay/i).first().isVisible(), 'Pay methods in Live or Studio');
    note(await page.getByText(/Looks good/i).isVisible(), 'Payments Looks good');
    await page.screenshot({ path: path.join(OUT, '07-payments.png'), fullPage: true });
    await page.getByRole('button', { name: /^Continue$/i }).click();

    await page.waitForURL(/\/studio\/setup\/golive/);
    note(await page.getByText(/Who you are/i).first().isVisible(), 'Go Live human checklist Who you are');
    note(await page.getByText(/What guests experience/i).first().isVisible(), 'Go Live human checklist Experience');
    note(!(await page.getByText(/^Identity$/).count()), 'No engineering Identity noun as checklist label');
    note(await page.getByText(/Looks good/i).isVisible(), 'Go Live Looks good');
    note(await page.getByText(/Live · guests can join|Live Experience/i).first().isVisible(), 'Go Live Live state');
    await page.screenshot({ path: path.join(OUT, '08-golive.png'), fullPage: true });

    const openExp = page.getByRole('link', { name: /Open Experience/i });
    let guestUrl = '';
    if (await openExp.count()) {
      guestUrl = await openExp.getAttribute('href');
      note(!!guestUrl, `Open Experience href present (${guestUrl})`);
    } else {
      note(false, 'Open Experience link missing');
    }

    if (guestUrl) {
      const abs = guestUrl.startsWith('http') ? guestUrl : `${BASE}${guestUrl}`;
      await page.goto(abs, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT, '09-guest-entry.png'), fullPage: true });
      const body = await page.locator('body').innerText();
      note(/Blue Door Evidence|Blue Door|joining|Continue|Menu/i.test(body), 'Guest entry shows experience grammar');
    }

    const failed = findings.filter((f) => !f.ok);
    const report = {
      base: BASE,
      out: OUT,
      passed: findings.filter((f) => f.ok).length,
      failed: failed.length,
      findings,
    };
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log('\nSUMMARY', report.passed, 'pass /', report.failed, 'fail');
    console.log('Artifacts:', OUT);
    await browser.close();
    process.exit(failed.length ? 1 : 0);
  } catch (err) {
    console.error('WALK ERROR', err);
    await page.screenshot({ path: path.join(OUT, 'error.png'), fullPage: true }).catch(() => {});
    await browser.close();
    process.exit(2);
  }
})();
