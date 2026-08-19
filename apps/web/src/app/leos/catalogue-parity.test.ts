import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STUDIO_GUEST_TRUST_CHECKLIST,
  choiceGroupHint,
  projectionChoiceSignals,
  projectionOrderCopy,
  safeGuestImageUrl,
} from './catalogue-parity';
import { PROJECTION_ITEMS } from '../studio/guest-experience-design';

test('rejects mixed-content and script image URLs', () => {
  assert.equal(safeGuestImageUrl('http://example.com/a.jpg'), null);
  assert.equal(safeGuestImageUrl('javascript:alert(1)'), null);
  assert.equal(safeGuestImageUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
  assert.equal(safeGuestImageUrl('/assets/dish.png'), '/assets/dish.png');
  assert.ok(safeGuestImageUrl('data:image/svg+xml,abc')?.startsWith('data:image/'));
});

test('G-04 choice hints match guest sheet language', () => {
  assert.equal(choiceGroupHint({ required: true, max: 1 }), 'Required · Choose 1');
  assert.equal(choiceGroupHint({ required: true, max: 2 }), 'Required · Choose 2');
  assert.equal(choiceGroupHint({ required: false, max: 1 }), 'Optional');
  assert.equal(choiceGroupHint({ required: false, max: 3 }), 'Optional · Choose up to 3');
});

test('choice signals prefer required group meaning', () => {
  const sig = projectionChoiceSignals({
    choiceGroups: [
      {
        id: 'extra',
        label: 'Add extras',
        required: false,
        max: 2,
        options: [{ id: 'bacon', label: 'Bacon' }],
      },
      {
        id: 'side',
        label: 'Choose your side',
        required: true,
        max: 1,
        options: [{ id: 'fries', label: 'Fries' }],
      },
    ],
  });
  assert.equal(sig.hint, 'Choose your side');
  assert.equal(sig.rule, 'Required · Choose 1');
});

test('order copy: placed + on it while preparing; all done only when complete', () => {
  const preparing = projectionOrderCopy('restaurant', 'preparing');
  assert.match(preparing.placed, /placed successfully|staff can see|team can see/i);
  assert.doesNotMatch(preparing.current, /all done/i);
  assert.match(preparing.completed, /all done/i);

  const hotel = projectionOrderCopy('hotel', 'created');
  assert.match(hotel.placed, /request received|team can see/i);
});

test('Setup trust checklist covers Identity through Go Live', () => {
  assert.deepEqual(
    STUDIO_GUEST_TRUST_CHECKLIST.map((row) => row.step),
    ['Identity', 'Experience', 'Places', 'Payments', 'Go Live'],
  );
});

test('restaurant sample burger carries required G-04 groups', () => {
  const burger = PROJECTION_ITEMS.find((i) => i.id === 'burger');
  assert.ok(burger?.choiceGroups?.some((g) => g.required));
  assert.ok(safeGuestImageUrl(burger?.imageUrl));
});
