import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_PACE,
  guestPaceView,
  itemSoldOut,
  livePace,
  normalisePace,
  orderRefusal,
  orderRefusalMessage,
  pausedPace,
  venueDate,
} from './kitchen-pace';
import {
  alreadyDelayed,
  cancelAlert,
  cleanCancelReason,
  cleanDelay,
  delayMinutes,
  pauseAlert,
  timelineFromEvents,
} from './order-log';
import { isTillTask, needsTillClose, tillTaskMessage } from './till-task';
import { paymentFeedRows } from './payment-feed';

const TZ = 'Africa/Johannesburg';
// 2026-11-27 18:00 in Johannesburg (UTC+2).
const NOW = new Date('2026-11-27T16:00:00.000Z');

test('A10: a pause with minutes ends by itself; without, it lasts until reopened', () => {
  const p = pausedPace(DEFAULT_PACE, { paused: true, minutes: 30, reason: 'Kitchen behind' }, NOW);
  assert.equal(p.pausedUntil, '2026-11-27T16:30:00.000Z');
  assert.equal(p.pauseReason, 'Kitchen behind');
  assert.equal(livePace(p, new Date('2026-11-27T16:29:00Z'), TZ).paused, true);
  const after = livePace(p, new Date('2026-11-27T16:30:00Z'), TZ);
  assert.equal(after.paused, false);
  assert.equal(after.pauseReason, '');
  const open = pausedPace(DEFAULT_PACE, { paused: true }, NOW);
  assert.equal(open.pausedUntil, null);
  assert.equal(livePace(open, new Date('2027-01-01T00:00:00Z'), TZ).paused, true);
  assert.equal(pausedPace(p, { paused: false }, NOW).paused, false);
});

test('A10: busy minutes stop when their time is up', () => {
  const pace = normalisePace({ busyMinutes: { Mains: 15 }, busyUntil: '2026-11-27T17:00:00Z' });
  assert.deepEqual(livePace(pace, NOW, TZ).busyMinutes, { Mains: 15 });
  assert.deepEqual(livePace(pace, new Date('2026-11-27T17:00:01Z'), TZ).busyMinutes, {});
});

test('A10: the reason survives a save, but only while paused', () => {
  const kept = normalisePace({ paused: true, pauseReason: 'Gas off', pausedUntil: 'nonsense' });
  assert.equal(kept.pauseReason, 'Gas off');
  assert.equal(kept.pausedUntil, null);
  assert.equal(normalisePace({ paused: false, pauseReason: 'Gas off' }).pauseReason, '');
});

test('A11: a closed day refuses orders and reads to guests like a pause', () => {
  const pace = normalisePace({ closedDates: [{ date: '2026-11-27', note: 'Staff party' }, { date: 'bad' }] });
  assert.equal(pace.closedDates.length, 1);
  const live = livePace(pace, NOW, TZ);
  assert.equal(live.closedToday, true);
  const refusal = orderRefusal(live, ['Mains'], 18 * 60);
  assert.deepEqual(refusal, { reason: 'closed_today' });
  assert.match(orderRefusalMessage(refusal!), /closed today/);
  assert.equal(guestPaceView(live, { allCategories: [], openCategories: [], minutes: 0 }).paused, true);
  assert.equal(livePace(pace, new Date('2026-11-28T08:00:00Z'), TZ).closedToday, false);
});

test('A12: sold out for today is back tomorrow by itself; until-changed stays', () => {
  const today = venueDate(NOW, TZ);
  assert.equal(today, '2026-11-27');
  const pace = normalisePace({ soldOutToday: { burger: today } });
  const live = livePace(pace, NOW, TZ);
  assert.equal(itemSoldOut(live, { id: 'burger', available: true }), true);
  const tomorrow = livePace(pace, new Date('2026-11-28T06:00:00Z'), TZ);
  assert.equal(itemSoldOut(tomorrow, { id: 'burger', available: true }), false);
  assert.equal(itemSoldOut(tomorrow, { id: 'salad', available: false }), true);
});

test('A13: delay choices are 5, 10, 20, 30 — and only once', () => {
  assert.equal(cleanDelay(10), 10);
  assert.equal(cleanDelay('20'), 20);
  assert.equal(cleanDelay(15), null);
  assert.equal(cleanDelay(undefined), null);
  const events = [{ eventName: 'FulfilmentDelayed', payload: { minutes: 10 } }];
  assert.equal(alreadyDelayed(events), true);
  assert.equal(delayMinutes(events), 10);
  assert.equal(alreadyDelayed([{ eventName: 'FulfilmentStatusChanged', payload: {} }]), false);
});

test('A14: the timeline lists every step with its time and who did it', () => {
  const steps = timelineFromEvents([
    { eventName: 'FulfilmentStatusChanged', occurredAt: '2026-11-27T16:05:00Z', payload: { status: 'ready', actor: { id: 's1', name: 'Lerato' } } },
    { eventName: 'FulfilmentCreated', occurredAt: '2026-11-27T16:00:00Z', payload: {} },
    { eventName: 'FulfilmentDelayed', occurredAt: '2026-11-27T16:02:00Z', payload: { minutes: 10, actor: { id: 's1', name: 'Lerato' } } },
    { eventName: 'SomethingElse', occurredAt: '2026-11-27T16:03:00Z', payload: {} },
  ]);
  assert.deepEqual(
    steps.map((s) => [s.step, s.by]),
    [
      ['Order placed', null],
      ['Delayed 10 min', 'Lerato'],
      ['Ready to take', 'Lerato'],
    ],
  );
});

test('A15: a cancel needs a known reason; "Other" needs words; managers hear it', () => {
  assert.equal(cleanCancelReason('Kitchen too busy'), 'Kitchen too busy');
  assert.equal(cleanCancelReason('Other'), null);
  assert.equal(cleanCancelReason('Other', 'Wrong table'), 'Other: Wrong table');
  assert.equal(cleanCancelReason('because'), null);
  assert.equal(cleanCancelReason(undefined), null);
  const alert = cancelAlert({ by: 'Sipho', placeCode: '12', reason: 'Item ran out' });
  assert.equal(alert.title, 'Order cancelled');
  assert.match(alert.body, /Sipho cancelled an order at table 12: Item ran out/);
  assert.match(pauseAlert({ by: 'Thandi', minutes: 30, reason: 'Kitchen behind' }).body, /for 30 min: Kitchen behind/);
  assert.match(pauseAlert({ by: 'Thandi' }).body, /until reopened/);
});

test('A8: only bills from the till need closing there; the task names table and money', () => {
  assert.equal(needsTillClose([{ externalCheckId: null }, {}]), false);
  assert.equal(needsTillClose([{ externalCheckId: 'chk-77' }]), true);
  const msg = tillTaskMessage({ placeCode: '12', paidMinor: 93600, checkIds: ['chk-77', 'chk-77'] });
  assert.equal(msg, 'Close on the till: table 12. R 936.00 paid in Lekki (till bill chk-77).');
  assert.ok(msg.length <= 160);
  assert.equal(isTillTask(msg), true);
});

test('A7: the payment feed says full or part and what is still owed now', () => {
  const rows = paymentFeedRows(
    [
      { id: 'p1', createdAt: new Date('2026-11-27T16:00:00Z'), amountMinor: 33000, tipMinor: 3000, sessionId: 's1' },
      { id: 'p2', createdAt: new Date('2026-11-27T16:10:00Z'), amountMinor: 50000, tipMinor: 0, sessionId: 's2' },
    ],
    [
      { id: 's1', placeCode: '14', billMinor: 93600, paidMinor: 30000 },
      { id: 's2', placeCode: '9', billMinor: 50000, paidMinor: 50000 },
    ],
  );
  assert.deepEqual(
    rows.map((r) => [r.paymentId, r.placeCode, r.kind, r.paidMinor, r.leftMinor, r.settled]),
    [
      ['p2', '9', 'full', 50000, 0, true],
      ['p1', '14', 'part', 30000, 63600, false],
    ],
  );
});
