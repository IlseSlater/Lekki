import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MemoryStorage,
  installPreviewStorage,
  isPreviewPath,
  resetPreviewFlagForTests,
  guestPreviewActive,
} from './preview-storage';
import {
  PREVIEW_ME,
  PREVIEW_SESSION_ID,
  buildPreviewTable,
  mineTotal,
  openTotal,
  previewSessionView,
  remaining,
  type PreviewVenue,
} from './preview-table';
import { answerPreviewRequest } from './preview-routes';
import {
  decodePreviewSnapshot,
  encodePreviewSnapshot,
  normalisePreviewScreen,
  previewUrl,
  screenForStudioUrl,
} from './preview-protocol';

test('phone link carries what guests see, and only that', () => {
  const snap = {
    venueName: 'Lekker Plek — Café',
    brandColour: '#D7A14A',
    logoUrl: '/assets/logo.png',
    paymentsActive: true,
    placeCode: 'T7',
    guestDesign: { tipStaff: true, googleReviewUrl: 'https://g.page/r/x' },
  };
  assert.deepEqual(decodePreviewSnapshot(encodePreviewSnapshot(snap)), snap);
  const url = previewUrl({ venueId: 'v1', screen: 'menu', snapshot: snap });
  const v = new URLSearchParams(url.split('?')[1]).get('v');
  assert.deepEqual(decodePreviewSnapshot(v), snap);
});

test('phone link drops anything unexpected or unsafe', () => {
  const evil = encodePreviewSnapshot({
    brandColour: 'red; background:url(x)',
    logoUrl: 'javascript:alert(1)',
    paymentsActive: 'yes',
    guestDesign: { 'bad key': true, nested: { a: 1 }, ok: false },
    extra: 'ignored',
  } as never);
  assert.deepEqual(decodePreviewSnapshot(evil), { guestDesign: { ok: false } });
  assert.equal(decodePreviewSnapshot('%%%not-base64'), null);
  assert.equal(decodePreviewSnapshot(''), null);
  assert.equal(decodePreviewSnapshot('x'.repeat(9000)), null);
});

const venue: PreviewVenue = {
  venueId: 'v1',
  organisationId: 'o1',
  venueName: 'Rusty Oak',
  brandColour: '#d7a14a',
  logoUrl: '',
  location: 'Parkhurst',
  guestDesign: null,
  paymentsActive: true,
  currency: 'ZAR',
};

const menu = [
  { id: 'm1', label: 'Craft lager', unitPrice: 48, routingTags: ['bar'] },
  { id: 'm2', label: 'Mojito', unitPrice: 85, routingTags: ['bar'] },
  { id: 'm3', label: 'Beef burger', unitPrice: 145, routingTags: ['kitchen'] },
  { id: 'm4', label: 'Chenin Blanc', unitPrice: 260, routingTags: ['bar'] },
];

function fakeWindow() {
  const real = new MemoryStorage();
  real.setItem('leos.studio.auth', '{"owner":true}');
  real.setItem('leos.staff.session', '{"token":"t"}');
  real.setItem('leos.session', '{"sessionId":"real-table"}');
  return { win: { localStorage: real as Storage, sessionStorage: new MemoryStorage() as Storage }, real };
}

test('preview path is only /preview', () => {
  assert.equal(isPreviewPath('/preview'), true);
  assert.equal(isPreviewPath('/preview?venue=v1'), true);
  assert.equal(isPreviewPath('/preview/'), true);
  assert.equal(isPreviewPath('/previewer'), false);
  assert.equal(isPreviewPath('/guest'), false);
  assert.equal(isPreviewPath(''), false);
});

test('preview storage keeps the sign-in and never sees a real guest table', () => {
  resetPreviewFlagForTests();
  const { win, real } = fakeWindow();
  const { local } = installPreviewStorage(win);
  assert.equal(guestPreviewActive(), true);
  assert.equal(win.localStorage.getItem('leos.studio.auth'), '{"owner":true}');
  assert.equal(win.localStorage.getItem('leos.staff.session'), '{"token":"t"}');
  assert.equal(win.localStorage.getItem('leos.session'), null);
  win.localStorage.setItem('leos.session', '{"sessionId":"preview"}');
  assert.equal(real.getItem('leos.session'), '{"sessionId":"real-table"}');
  assert.equal(local.getItem('leos.session'), '{"sessionId":"preview"}');
  resetPreviewFlagForTests();
});

test('sample table uses the venue’s own menu, three guests and one shared dish', () => {
  const t = buildPreviewTable({ venue, menu, placeCode: 'T7' });
  const view = previewSessionView(t);
  assert.equal(view.id, PREVIEW_SESSION_ID);
  assert.equal(view.placeCode, 'T7');
  assert.equal(view.venueName, 'Rusty Oak');
  assert.equal(view.participants.length, 3);
  const labels = view.transactions.flatMap((tx) => tx.lines.map((l) => l.label));
  assert.deepEqual(labels, ['Craft lager', 'Mojito', 'Beef burger', 'Chenin Blanc']);
  const shared = view.transactions.flatMap((tx) => tx.lines).filter((l) => l.sharedWith.length);
  assert.equal(shared.length, 1);
  assert.equal(openTotal(t), 2 * 48 + 85 + 145 + 260);
  // Mine: two lagers + a third of the wine.
  assert.equal(mineTotal(t), Math.round((96 + 260 / 3) * 100) / 100);
});

test('empty menu: an empty table, not an invented one', () => {
  const t = buildPreviewTable({ venue, menu: [] });
  assert.equal(previewSessionView(t).transactions.length, 0);
});

test('reads of the venue and menu reach the real API', () => {
  const t = buildPreviewTable({ venue, menu });
  assert.deepEqual(answerPreviewRequest(t, 'GET', 'http://api:3000/catalogue/venue/v1', null), {
    handled: false,
  });
  assert.deepEqual(answerPreviewRequest(t, 'GET', 'http://api:3000/studio/workspace/v1', null), {
    handled: false,
  });
  const session = answerPreviewRequest(t, 'GET', `http://api:3000/sessions/${PREVIEW_SESSION_ID}`, null);
  assert.equal(session.handled, true);
});

test('no write ever leaves the preview — orders, payments, help, unknown', () => {
  const t = buildPreviewTable({ venue, menu });
  for (const [url, body] of [
    ['http://api:3000/transactions', { sessionId: PREVIEW_SESSION_ID, lines: [{ catalogueItemId: 'm1', quantity: 1 }] }],
    [`http://api:3000/payments/request/${PREVIEW_SESSION_ID}`, { scope: 'visit' }],
    ['http://api:3000/assistance', { sessionId: PREVIEW_SESSION_ID, kind: 'service' }],
    [`http://api:3000/sessions/${PREVIEW_SESSION_ID}/leave`, {}],
    ['http://api:3000/feedback/sessions/preview/note', { note: 'hi' }],
    ['http://api:3000/anything/else', {}],
  ] as const) {
    const a = answerPreviewRequest(t, 'POST', url, body);
    assert.equal(a.handled, true, url);
  }
  // Even before the sample table exists.
  assert.equal(answerPreviewRequest(null, 'POST', 'http://api:3000/transactions', {}).handled, true);
  assert.equal(answerPreviewRequest(t, 'PATCH', 'http://api:3000/fulfilments/x/status', {}).handled, true);
});

test('an order in the preview lands on the sample table', () => {
  const t = buildPreviewTable({ venue, menu });
  const before = openTotal(t);
  answerPreviewRequest(t, 'POST', 'http://api:3000/transactions', {
    participantId: PREVIEW_ME,
    lines: [{ catalogueItemId: 'm3', quantity: 2 }],
  });
  assert.equal(openTotal(t), before + 290);
});

test('paying an amount leaves the rest open; paying the visit settles it', () => {
  const t = buildPreviewTable({ venue, menu });
  const total = openTotal(t);
  answerPreviewRequest(t, 'POST', `http://api:3000/payments/request/${PREVIEW_SESSION_ID}`, {
    scope: 'amount',
    amount: 300,
    tipPercent: 10,
  });
  assert.equal(remaining(t), total - 300);
  const view = previewSessionView(t);
  assert.equal(view.payments[0].status, 'completed');
  assert.equal(view.payments[0].tipAmount, 30);
  answerPreviewRequest(t, 'POST', `http://api:3000/payments/request/${PREVIEW_SESSION_ID}`, { scope: 'visit' });
  assert.equal(remaining(t), 0);
  assert.ok(previewSessionView(t).transactions.every((tx) => tx.status === 'settled'));
});

test('sharing and claiming change only the sample', () => {
  const t = buildPreviewTable({ venue, menu });
  const mojito = t.transactions[0].lines[1];
  answerPreviewRequest(t, 'POST', `http://api:3000/sessions/${PREVIEW_SESSION_ID}/share-line`, {
    lineId: mojito.id,
    action: 'join',
  });
  assert.deepEqual(mojito.sharedWith.sort(), ['preview-naledi', PREVIEW_ME].sort());
  const burger = t.transactions[1].lines[0];
  answerPreviewRequest(t, 'POST', `http://api:3000/sessions/${PREVIEW_SESSION_ID}/claim-lines`, {
    participantId: PREVIEW_ME,
    lineIds: [burger.id],
  });
  assert.equal(burger.participantId, PREVIEW_ME);
});

test('screens: Studio pages pick the guest screen they are about', () => {
  assert.equal(screenForStudioUrl('/studio/menu'), 'menu');
  assert.equal(screenForStudioUrl('/studio/setup/experience'), 'menu');
  assert.equal(screenForStudioUrl('/studio/at-the-table'), 'bill');
  assert.equal(screenForStudioUrl('/studio/payments'), 'pay');
  assert.equal(screenForStudioUrl('/studio/setup/payments?x=1'), 'pay');
  assert.equal(screenForStudioUrl('/studio/place'), 'arrive');
  assert.equal(normalisePreviewScreen('PAY'), 'pay');
  assert.equal(normalisePreviewScreen('nope'), 'arrive');
  assert.equal(previewUrl({ venueId: 'v 1', screen: 'menu', placeCode: 'T7' }), '/preview?venue=v+1&screen=menu&table=T7');
});

test('asking for a reply to a note never leaves the preview', () => {
  const t = buildPreviewTable({ venue, menu });
  assert.deepEqual(
    answerPreviewRequest(t, 'POST', `http://api:3000/feedback/sessions/${PREVIEW_SESSION_ID}/note/reply`, {}),
    { handled: true, status: 200, body: { reply: null } },
  );
});
