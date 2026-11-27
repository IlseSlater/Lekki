import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MIN_VISITS_FOR_AVERAGE,
  eveningSentence,
  roundedAverage,
  stayMinutes,
} from './owner-evening';

function visit(minutes: number | null) {
  const startedAt = new Date('2026-11-26T18:00:00Z');
  return {
    startedAt,
    completedAt: minutes === null ? null : new Date(startedAt.getTime() + minutes * 60000),
  };
}

describe('owner evening', () => {
  it('says nothing until the averages rest on enough finished visits', () => {
    const few = Array.from({ length: MIN_VISITS_FOR_AVERAGE - 1 }, () => visit(50));
    assert.equal(eveningSentence({ visits: few, tipMinor: 5000, tipCount: 3, currency: 'ZAR' }), null);
    assert.equal(eveningSentence({ visits: [], tipMinor: 0, tipCount: 0, currency: 'ZAR' }), null);
  });

  it('ignores open visits and implausible stays', () => {
    const visits = [visit(null), visit(1), visit(600), visit(40), visit(60)];
    assert.deepEqual(stayMinutes(visits), [40, 60]);
  });

  it('rounds the average to the nearest five minutes', () => {
    assert.equal(roundedAverage([48, 52, 53]), 50);
    assert.equal(roundedAverage([]), 0);
  });

  it('reads as one sentence with tips when there are tips', () => {
    const visits = Array.from({ length: 6 }, () => visit(50));
    const s = eveningSentence({ visits, tipMinor: 38000, tipCount: 4, currency: 'ZAR' });
    assert.match(s ?? '', /^Tonight: 6 tables settled, about 50 minutes each and R\s?380 in tips\.$/);
  });

  it('leaves tips out when none were left', () => {
    const visits = Array.from({ length: 5 }, () => visit(45));
    const s = eveningSentence({ visits, tipMinor: 0, tipCount: 0, currency: 'ZAR' });
    assert.equal(s, 'Tonight: 5 tables settled and about 45 minutes each.');
  });
});
