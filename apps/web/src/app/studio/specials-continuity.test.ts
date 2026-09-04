import assert from 'node:assert/strict';
import test from 'node:test';
import {
  featuredMenuItems,
  menuWithoutSpecialsSurface,
  resolveShowSpecials,
  specialsCarouselItems,
} from './specials-continuity';

const catalogue = [
  {
    id: 's1',
    label: 'Chef’s Bowl',
    category: 'Specials',
    unitPrice: 140,
    routingTags: ['food', 'special'],
  },
  {
    id: 's2',
    label: 'Weekend Roast',
    category: 'Specials',
    unitPrice: 165,
    routingTags: ['food', 'specials'],
  },
  {
    id: 'm1',
    label: 'Classic Burger',
    category: 'Mains',
    unitPrice: 120,
    routingTags: ['food', 'mains'],
    imageUrl: 'https://example.com/b.jpg',
  },
  {
    id: 'm2',
    label: 'Garden Salad',
    category: 'Mains',
    unitPrice: 85,
    routingTags: ['food', 'mains'],
  },
  {
    id: 'd1',
    label: 'Craft Lager',
    category: 'Drinks',
    unitPrice: 45,
    routingTags: ['beverage', 'drinks'],
  },
];

test('Studio specials toggle resolves for workspace token', () => {
  assert.equal(resolveShowSpecials('qr-demo-restaurant', []), false);
  assert.equal(
    resolveShowSpecials('qr-demo-restaurant', [
      { token: 'qr-demo-restaurant', typeId: 'restaurant', guestDesign: { specials: true } },
    ]),
    true,
  );
});

test('carousel takes Specials category items', () => {
  const carousel = specialsCarouselItems(catalogue);
  assert.equal(carousel.length, 2);
  assert.equal(carousel[0].label, 'Chef’s Bowl');
});

test('featured excludes specials and drinks', () => {
  const featured = featuredMenuItems(catalogue, 4);
  assert.ok(featured.every((i) => i.category === 'Mains'));
  assert.equal(featured[0].id, 'm1');
});

test('menu hides specials when Specials page is on', () => {
  const menu = menuWithoutSpecialsSurface(catalogue, true);
  assert.equal(menu.length, 3);
  assert.ok(menu.every((i) => i.category !== 'Specials'));
});
