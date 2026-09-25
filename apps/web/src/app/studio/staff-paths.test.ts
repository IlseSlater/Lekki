import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STAFF_LOGIN,
  staffHomeForRole,
  staffMonitorPath,
  staffPinReady,
  staffShiftContinue,
  staffStationPath,
} from './staff-paths';

test('assigned Experience lands on Staff, never Studio kitchen', () => {
  assert.equal(staffHomeForRole('kitchen'), '/staff/station/kitchen');
  assert.equal(staffHomeForRole('bar'), '/staff/station/bar');
  assert.equal(staffHomeForRole('waiter'), '/staff/service');
  assert.equal(staffHomeForRole('counter'), '/staff/station/counter');
  assert.equal(staffHomeForRole('staff'), '/staff/service');
  assert.doesNotMatch(staffHomeForRole('kitchen'), /\/studio\//);
  assert.equal(staffStationPath('station-kitchen'), '/staff/station/kitchen');
});

test('unknown role returns to PIN, not a guessed station', () => {
  assert.equal(staffHomeForRole('owner'), STAFF_LOGIN);
});

test('PIN continue needs four digits', () => {
  assert.equal(staffPinReady('111'), false);
  assert.equal(staffPinReady('1111'), true);
  assert.equal(staffPinReady(''), false);
});

test('after PIN, ?next= only if it stays in Staff', () => {
  assert.equal(
    staffShiftContinue({
      homePath: '/staff/station/kitchen',
      role: 'kitchen',
      nextQuery: '/staff/station/kitchen',
    }),
    '/staff/station/kitchen',
  );
  assert.equal(
    staffShiftContinue({
      homePath: '/staff/station/kitchen',
      role: 'kitchen',
      nextQuery: '/studio/grow',
    }),
    '/staff/station/kitchen',
  );
  assert.equal(
    staffShiftContinue({
      homePath: '/studio/kitchen',
      role: 'kitchen',
    }),
    '/staff/station/kitchen',
  );
});

test('owner monitor is Staff with monitor flag, not a preview', () => {
  assert.equal(staffMonitorPath('/staff/station/kitchen'), '/staff/station/kitchen?monitor=1');
});
